
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDatabase } from '@/contexts/DatabaseContext';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, TrendingUp, Calculator, ChevronRight, Info } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { analyzeBillDetails } from '@/services/ai';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CostPredictor: React.FC = () => {
    const { bills, insuranceFiles, updateBillAnalysis } = useDatabase();
    const { toast } = useToast();
    const [selectedBill, setSelectedBill] = useState<any>(null);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [recalculateProgress, setRecalculateProgress] = useState({ current: 0, total: 0 });

    // Get active insurance policy
    const activeInsurance = useMemo(() => {
        // Prefer approved, analyzed docs
        const approved = insuranceFiles.find(doc => doc.status === 'approved' && doc.analysisResult);
        if (approved) return approved;

        // Fallback: any analyzed doc (even if pending/processing)
        return insuranceFiles.find(doc => doc.analysisResult);
    }, [insuranceFiles]);

    const handleRecalculateAll = async () => {
        if (!activeInsurance || !activeInsurance.analysisResult) {
            toast({
                title: "No Active Policy",
                description: "Please upload and approve an insurance policy first.",
                variant: "destructive"
            });
            return;
        }

        setIsRecalculating(true);
        setRecalculateProgress({ current: 0, total: bills.length });

        try {
            const result = activeInsurance.analysisResult;
            const insuranceContext = `
                Policy: ${result.overview?.insurerName || 'Unknown Insurer'} - ${result.overview?.policyNumber || 'N/A'}
                Effective Date: ${result.overview?.effectiveDate || 'N/A'}
                Expiration Date: ${result.overview?.expirationDate || 'N/A'}
                
                Financials:
                - Deductible: Individual ${result.financials?.deductible?.individual || 'N/A'}, Family ${result.financials?.deductible?.family || 'N/A'}
                - Out-of-Pocket Max: Individual ${result.financials?.outOfPocketMax?.individual || 'N/A'}, Family ${result.financials?.outOfPocketMax?.family || 'N/A'}
                - Co-insurance: In-Network ${result.financials?.coinsuranceRate?.inNetwork || 'N/A'}, Out-of-Network ${result.financials?.coinsuranceRate?.outOfNetwork || 'N/A'}
                - Copays: PCP ${result.financials?.copay?.pcp || 'N/A'}, Specialist ${result.financials?.copay?.specialist || 'N/A'}, ER ${result.financials?.copay?.er || 'N/A'}
                
                Coverage Details:
                ${result.coverage?.map((c: any) => `- ${c.type}: Limit ${c.limit}, Deductible ${c.deductible}, Copay ${c.copay}`).join('\n') || 'No specific coverage details found.'}
                
                Benefits:
                ${result.benefits?.filter((b: any) => b.covered).map((b: any) => `- ${b.category}: ${b.description}`).join('\n') || 'No specific benefits listed.'}
                
                Exclusions:
                ${result.exclusions?.map((e: any) => `- ${e.item}: ${e.reason}`).join('\n') || 'No specific exclusions listed.'}
            `;

            let processed = 0;
            for (const bill of bills) {
                if (!bill.fileUrl) {
                    processed++;
                    setRecalculateProgress(prev => ({ ...prev, current: processed }));
                    continue;
                }

                try {
                    // Fetch file
                    let finalUrl = bill.fileUrl;
                    if (bill.fileUrl.includes('supabase.co') && bill.fileUrl.includes('hospital-bills')) {
                        const path = bill.fileUrl.split('hospital-bills/')[1]?.split('?')[0];
                        if (path) {
                            const decodedPath = decodeURIComponent(path);
                            const { data } = await supabase.storage
                                .from('hospital-bills')
                                .createSignedUrl(decodedPath, 3600);
                            if (data?.signedUrl) finalUrl = data.signedUrl;
                        }
                    }

                    const response = await fetch(finalUrl);
                    if (!response.ok) continue;
                    const blob = await response.blob();
                    const file = new File([blob], "bill.jpg", { type: blob.type || 'image/jpeg' });

                    // Re-analyze with new context
                    const analysis = await analyzeBillDetails(file, insuranceContext);

                    if (analysis) {
                        // Update DB
                        await supabase
                            .from('hospital_bills')
                            .update({ analysis_result: analysis } as any)
                            .eq('id', bill.id);

                        // Update Context
                        updateBillAnalysis(bill.id, analysis);
                    }
                } catch (err) {
                    console.error(`Failed to re-analyze bill ${bill.id}`, err);
                }

                processed++;
                setRecalculateProgress(prev => ({ ...prev, current: processed }));
            }

            toast({
                title: "Recalculation Complete",
                description: `Updated predictions for ${processed} bills based on active policy.`,
            });
        } catch (error) {
            console.error("Recalculation error:", error);
            toast({
                title: "Recalculation Failed",
                description: "An error occurred while reprocessing bills.",
                variant: 'destructive'
            });
        } finally {
            setIsRecalculating(false);
        }
    };

    // Calculate totals from Analyzed Bills
    const calculations = useMemo(() => {
        let totalBilled = 0;
        let estimatedInsurance = 0;
        let estimatedPatient = 0;
        let billsAnalyzed = 0;
        let pendingBills = 0;

        const analyzedBillsData = bills.map(bill => {
            const analysis = bill.analysisResult;

            // If we have detailed analysis with coverage prediction
            if (analysis && analysis.coveragePrediction) {
                totalBilled += analysis.overview.totalAmount || 0;
                estimatedInsurance += analysis.coveragePrediction.estimatedInsuranceCoverage || 0;
                estimatedPatient += analysis.coveragePrediction.estimatedPatientResponsibility || 0;
                billsAnalyzed++;

                // Determine if coverage is applicable (N/A only if confidence is low/none or calculation failed)
                const isNotApplicable = analysis.coveragePrediction.confidence === 'Low' && analysis.coveragePrediction.estimatedInsuranceCoverage === 0;

                return {
                    id: bill.id,
                    hospital: bill.hospitalName,
                    date: bill.billDate,
                    amount: analysis.overview.totalAmount,
                    patientResp: analysis.coveragePrediction.estimatedPatientResponsibility,
                    insuranceResp: analysis.coveragePrediction.estimatedInsuranceCoverage,
                    confidence: analysis.coveragePrediction.confidence,
                    reasoning: analysis.coveragePrediction.reasoning,
                    schemes: analysis.schemes,
                    isNotApplicable,
                    status: 'Analyzed'
                };
            } else {
                // Fallback for unanalyzed or simple bills
                pendingBills++;
                // If we have a raw amount but no analysis, we count it as "billed" but unknown split
                if (bill.amount) totalBilled += Number(bill.amount);

                return {
                    id: bill.id,
                    hospital: bill.hospitalName,
                    date: bill.billDate,
                    amount: Number(bill.amount),
                    patientResp: null,
                    insuranceResp: null,
                    confidence: 'None',
                    status: 'Pending Analysis'
                };
            }
        });

        return {
            totalBilled,
            estimatedInsurance,
            estimatedPatient,
            billsAnalyzed,
            pendingBills,
            analyzedBillsData
        };
    }, [bills]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Calculator className="w-8 h-8 text-primary" />
                    Cost Predictor
                </h1>
                <p className="text-muted-foreground mt-1">
                    Estimate your final financial liability based on uploaded bills and insurance coverage.
                </p>
                <div className="mt-4 flex justify-end">
                    <Button
                        onClick={handleRecalculateAll}
                        disabled={isRecalculating || !activeInsurance}
                        className="gap-2"
                    >
                        {isRecalculating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Recalculating ({recalculateProgress.current}/{recalculateProgress.total})...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Recalculate All Predictions
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Insurance Context Banner */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-primary">
                            Active Policy: {activeInsurance?.analysisResult?.overview?.insurerName || 'No Active Policy Found'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {activeInsurance
                                ? `Policy #${activeInsurance.analysisResult?.overview?.policyNumber} • ${activeInsurance.analysisResult?.overview?.summary}`
                                : "Upload and analyze an insurance document to get accurate predictions."}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="card-elevated">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            ${calculations.totalBilled.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across {calculations.billsAnalyzed + calculations.pendingBills} bills
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-elevated">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Est. Insurance Coverage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-success">
                            ${calculations.estimatedInsurance.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Based on policy limits
                        </p>
                    </CardContent>
                </Card>

                <Card className="card-elevated bg-destructive/5 border-destructive/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">Est. You Pay</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            ${calculations.estimatedPatient.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Projected Liability
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card className="card-elevated">
                <CardHeader>
                    <CardTitle>Detailed Cost Breakdown</CardTitle>
                    <CardDescription>
                        Individual analysis of each uploaded hospital bill.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {calculations.analyzedBillsData.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No bills found. Upload bills to see cost predictions.
                            </div>
                        ) : (
                            calculations.analyzedBillsData.map((item) => (
                                <div key={item.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-secondary/30 rounded-lg gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{item.hospital}</h4>
                                            {item.status === 'Pending Analysis' && (
                                                <Badge variant="outline" className="text-warning border-warning">Pending Analysis</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Date: {new Date(item.date).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="text-right">
                                            <p className="text-muted-foreground">Billed</p>
                                            <p className="font-medium">${item.amount?.toLocaleString()}</p>
                                        </div>

                                        {item.status === 'Analyzed' && (
                                            <>
                                                <div className="hidden md:block w-px h-8 bg-border" />
                                                <div className="text-right">
                                                    <p className="text-muted-foreground">Insurance</p>
                                                    {item.isNotApplicable ? (
                                                        <Badge variant="secondary" className="bg-muted text-muted-foreground">N/A</Badge>
                                                    ) : (
                                                        <p className="font-medium text-success">${item.insuranceResp?.toLocaleString()}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-muted-foreground">You Pay</p>
                                                    <p className="font-bold text-destructive underline decoration-dotted underline-offset-4">
                                                        ${item.patientResp?.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-right min-w-[80px] flex flex-col items-end gap-1">
                                                    <Badge variant={item.confidence === 'High' ? 'default' : 'secondary'} className={item.confidence === 'High' ? 'bg-success/20 text-success hover:bg-success/30' : ''}>
                                                        {item.confidence} Conf.
                                                    </Badge>
                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setSelectedBill(item)}>
                                                        Details <ChevronRight className="w-3 h-3 ml-1" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {calculations.pendingBills > 0 && (
                        <div className="mt-6 flex items-center gap-2 p-4 bg-warning/10 text-warning rounded-lg border border-warning/20">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">
                                You have {calculations.pendingBills} bills that haven't been fully analyzed by AI yet.
                                Go to <strong>Bill History</strong> and click the spark/analyze icon on them to get a complete cost prediction.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="text-xs text-center text-muted-foreground">
                * Estimations are based on AI analysis of provided documents and may not reflect final adjudicated claims.
            </div>

            {/* Analysis Details Modal */}
            <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detailed Cost Analysis</DialogTitle>
                        <DialogDescription>
                            Breakdown for {selectedBill?.hospital} bill of ${selectedBill?.amount?.toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBill && (
                        <ScrollArea className="max-h-[60vh] pr-4">
                            <div className="space-y-6">
                                {/* Core stats */}
                                <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg">
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground">You Pay</p>
                                        <p className="text-xl font-bold text-destructive">${selectedBill.patientResp?.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center border-l border-border">
                                        <p className="text-xs text-muted-foreground">Insurance Pays</p>
                                        <p className="text-xl font-bold text-success">
                                            {selectedBill.isNotApplicable ? 'N/A' : `$${selectedBill.insuranceResp?.toLocaleString()}`}
                                        </p>
                                    </div>
                                    <div className="text-center border-l border-border">
                                        <p className="text-xs text-muted-foreground">Coverage</p>
                                        <p className="text-xl font-bold">
                                            {selectedBill.amount ? Math.round(((selectedBill.insuranceResp || 0) / selectedBill.amount) * 100) : 0}%
                                        </p>
                                    </div>
                                </div>

                                {/* Reasoning */}
                                <div>
                                    <h4 className="flex items-center gap-2 font-semibold text-primary mb-2">
                                        <Info className="w-4 h-4" />
                                        AI Reasoning
                                    </h4>
                                    <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                                        {selectedBill.reasoning || "No detailed reasoning provided."}
                                    </div>
                                </div>

                                {/* Schemes/Terms */}
                                {selectedBill.schemes && selectedBill.schemes.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-primary mb-3">Applied Insurance Terms</h4>
                                        <div className="grid gap-3">
                                            {selectedBill.schemes.map((scheme: any, idx: number) => (
                                                <div key={idx} className="flex items-start justify-between p-3 border border-border rounded-lg bg-card">
                                                    <div>
                                                        <p className="font-medium">{scheme.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">{scheme.description}</p>
                                                    </div>
                                                    <Badge variant="outline">{scheme.value}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CostPredictor;
