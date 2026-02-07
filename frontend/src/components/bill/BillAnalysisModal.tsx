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
import { Loader2, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { BillAnalysisResult } from "@/services/ai";

interface BillAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: BillAnalysisResult | null;
    isLoading: boolean;
}

const BillAnalysisModal: React.FC<BillAnalysisModalProps> = ({
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
                        <span className="text-primary">✨</span> AI Bill Analysis
                    </DialogTitle>
                    <DialogDescription>
                        Detailed breakdown and insurance coverage prediction.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p className="text-muted-foreground animate-pulse">Analyzing bill details...</p>
                    </div>
                ) : result ? (
                    <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                        <div className="px-1">
                            <TabsList className="grid w-full grid-cols-4 mb-4">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="services">Services</TabsTrigger>
                                <TabsTrigger value="coverage">Coverage</TabsTrigger>
                                <TabsTrigger value="schemes">Schemes</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 pr-4">
                            <TabsContent value="overview" className="space-y-4 mt-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                                        <p className="text-sm text-muted-foreground">Patient Name</p>
                                        <p className="font-medium">{result.overview.patientName || 'Not detected'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                                        <p className="text-sm text-muted-foreground">Hospital/Provider</p>
                                        <p className="font-medium">{result.overview.hospitalName || 'Not detected'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                                        <p className="text-sm text-muted-foreground">Date of Service</p>
                                        <p className="font-medium">{result.overview.date || 'Not detected'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-primary/10 space-y-2">
                                        <p className="text-sm text-primary">Total Amount</p>
                                        <p className="text-2xl font-bold text-primary">
                                            ${result.overview.totalAmount?.toLocaleString()}
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

                            <TabsContent value="services" className="mt-0">
                                <div className="rounded-xl border bg-card overflow-hidden">
                                    <div className="grid grid-cols-12 gap-4 p-4 bg-secondary/50 font-medium text-sm text-muted-foreground border-b">
                                        <div className="col-span-8">Service Description</div>
                                        <div className="col-span-2">Code</div>
                                        <div className="col-span-2 text-right">Charge</div>
                                    </div>
                                    {result.services.map((service, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-secondary/20 transition-colors"
                                        >
                                            <div className="col-span-8 font-medium">{service.name}</div>
                                            <div className="col-span-2 text-sm text-muted-foreground">
                                                {service.code ? <Badge variant="outline">{service.code}</Badge> : '-'}
                                            </div>
                                            <div className="col-span-2 text-right font-medium">
                                                ${service.charge.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                    {result.services.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No specific line items detected.
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="coverage" className="mt-0 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 text-center space-y-2">
                                        <div className="mx-auto w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <p className="text-sm text-green-700 font-medium">Estimated Insurance</p>
                                        <p className="text-3xl font-bold text-green-700">
                                            ${result.coveragePrediction.estimatedInsuranceCoverage?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center space-y-2">
                                        <div className="mx-auto w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
                                            <AlertCircle className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <p className="text-sm text-orange-700 font-medium">Est. Patient Responsibility</p>
                                        <p className="text-3xl font-bold text-orange-700">
                                            ${result.coveragePrediction.estimatedPatientResponsibility?.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">AI Analysis & Reasoning</h3>
                                        <Badge variant={
                                            result.coveragePrediction.confidence === 'High' ? 'default' :
                                                result.coveragePrediction.confidence === 'Medium' ? 'secondary' : 'outline'
                                        }>
                                            {result.coveragePrediction.confidence} Confidence
                                        </Badge>
                                    </div>
                                    <div className="p-4 rounded-xl bg-secondary/30 text-sm leading-relaxed">
                                        {result.coveragePrediction.reasoning}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="schemes" className="mt-0">
                                <div className="grid gap-4">
                                    {result.schemes.map((scheme, index) => (
                                        <div key={index} className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <HelpCircle className="w-5 h-5 text-primary" />
                                                    <h4 className="font-semibold text-lg">{scheme.name}</h4>
                                                </div>
                                                {scheme.value && (
                                                    <Badge variant="secondary" className="text-base">
                                                        {scheme.value}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed pl-7">
                                                {scheme.description}
                                            </p>
                                        </div>
                                    ))}
                                    {result.schemes.length === 0 && (
                                        <div className="p-8 text-center text-muted-foreground">
                                            No specific schemes detected or explained.
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

export default BillAnalysisModal;
