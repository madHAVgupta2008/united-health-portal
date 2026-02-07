import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { InsuranceAnalysisResult } from "@/services/ai";

interface InsuranceAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: InsuranceAnalysisResult | null;
    isLoading: boolean;
}

const InsuranceAnalysisModal: React.FC<InsuranceAnalysisModalProps> = ({
    isOpen,
    onClose,
    result,
    isLoading,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <span className="text-primary">✨</span> AI Insurance Analysis
                    </DialogTitle>
                    <DialogDescription>
                        Detailed breakdown of your insurance document.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Analyzing insurance document...</p>
                    </div>
                ) : result ? (
                    <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                        <div className="px-1">
                            <TabsList className="grid w-full grid-cols-5 mb-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="coverage">Coverage</TabsTrigger>
                                <TabsTrigger value="benefits">Benefits</TabsTrigger>
                                <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
                                <TabsTrigger value="tips">Tips</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 pr-4">
                            <TabsContent value="overview" className="space-y-4 mt-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                                        <p className="text-sm text-muted-foreground">Policy Number</p>
                                        <p className="font-medium">{result.overview.policyNumber || 'Not detected'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                                        <p className="text-sm text-muted-foreground">Insurer</p>
                                        <p className="font-medium">{result.overview.insurerName || 'Not detected'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                                        <p className="text-sm text-muted-foreground">Policy Holder</p>
                                        <p className="font-medium">{result.overview.policyHolder || 'Not detected'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-primary/10 space-y-2">
                                        <p className="text-sm text-primary">Valid Period</p>
                                        <p className="font-medium text-primary">
                                            {result.overview.effectiveDate || '?'} - {result.overview.expirationDate || '?'}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border bg-card">
                                    <h3 className="font-semibold mb-2">Summary</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {result.overview.summary}
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="coverage" className="mt-0">
                                <div className="rounded-xl border bg-card overflow-hidden">
                                    <div className="grid grid-cols-12 gap-4 p-4 bg-secondary/50 font-medium text-sm text-muted-foreground border-b">
                                        <div className="col-span-4">Coverage Type</div>
                                        <div className="col-span-3">Limit</div>
                                        <div className="col-span-2">Deductible</div>
                                        <div className="col-span-3">Copay</div>
                                    </div>
                                    {result.coverage.map((item, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-secondary/20 transition-colors"
                                        >
                                            <div className="col-span-4 font-medium">{item.type}</div>
                                            <div className="col-span-3">{item.limit}</div>
                                            <div className="col-span-2">{item.deductible || '-'}</div>
                                            <div className="col-span-3">{item.copay || '-'}</div>
                                        </div>
                                    ))}
                                    {result.coverage.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No coverage details detected.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="benefits" className="mt-0">
                                <div className="grid gap-3">
                                    {result.benefits.map((benefit, index) => (
                                        <div key={index} className="p-4 rounded-xl border bg-card flex items-start gap-3">
                                            <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center ${benefit.covered ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                                {benefit.covered ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{benefit.category}</h4>
                                                <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {result.benefits.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No benefits information detected.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="exclusions" className="mt-0">
                                <div className="grid gap-3">
                                    {result.exclusions.map((exclusion, index) => (
                                        <div key={index} className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <XCircle className="w-5 h-5 text-destructive" />
                                                <h4 className="font-semibold text-destructive">{exclusion.item}</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground pl-7">{exclusion.reason}</p>
                                        </div>
                                    ))}
                                    {result.exclusions.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No exclusions detected.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="tips" className="mt-0">
                                <div className="grid gap-4">
                                    {result.recommendations.map((rec, index) => (
                                        <div key={index} className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                                                    <h4 className="font-semibold">{rec.title}</h4>
                                                </div>
                                                <Badge variant={
                                                    rec.priority === 'High' ? 'destructive' :
                                                        rec.priority === 'Medium' ? 'default' : 'secondary'
                                                }>
                                                    {rec.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed pl-7">
                                                {rec.description}
                                            </p>
                                        </div>
                                    ))}
                                    {result.recommendations.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No recommendations generated.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                        <p className="text-lg font-medium">Analysis Failed</p>
                        <p className="text-muted-foreground">Could not analyze the document. Please try again.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default InsuranceAnalysisModal;
