'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dna,
  Search,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Atom,
  FlaskConical,
  Sprout,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-provider';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const QUICK_EXAMPLES = [
  { name: 'Urea', label: 'Urea (Nitrogen Fertilizer)' },
  { name: 'Azadirachtin', label: 'Azadirachtin (Neem Extract)' },
  { name: 'Mancozeb', label: 'Mancozeb (Fungicide)' },
  { name: 'Imidacloprid', label: 'Imidacloprid (Insecticide)' },
  { name: 'Glyphosate', label: 'Glyphosate (Weedicide)' },
  { name: 'Carbendazim', label: 'Carbendazim (Systemic Fungicide)' },
  { name: 'Chlorpyrifos', label: 'Chlorpyrifos (Organophosphate)' },
];

export default function CropSciencePage() {
  const [searchTerm, setSearchTerm] = useState('Urea');
  const [selectedCompound, setSelectedCompound] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCompound = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setIsSaved(false);
    try {
      const res = await fetch(`/api/science/pubchem?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve compound');
      }
      setSelectedCompound(data.compound);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error querying PubChem');
      setSelectedCompound(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompound('Urea');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchCompound(searchTerm.trim());
    }
  };

  const handleSaveToFirestore = async () => {
    if (!selectedCompound) return;
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in with Google to save bioscience investigations to your account.',
      });
      return;
    }

    try {
      const queryId = `BIO_${selectedCompound.cid}_${Date.now().toString().slice(-4)}`;
      const docRef = doc(db, 'users', user.uid, 'bioscience_queries', queryId);
      await setDoc(docRef, {
        id: queryId,
        userId: user.uid,
        compoundName: selectedCompound.title,
        cid: selectedCompound.cid,
        formula: selectedCompound.molecularFormula || '',
        safetySummary: selectedCompound.category || '',
        timestamp: new Date().toISOString(),
      });
      setIsSaved(true);
      toast({
        title: 'Saved to Farm Cloud',
        description: `${selectedCompound.title} has been persisted to your Firestore records.`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/bioscience_queries`);
      toast({
        variant: 'destructive',
        title: 'Error Saving',
        description: 'Could not persist record to Firestore.',
      });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-teal-100 text-teal-800">
              <Dna className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Crop Bioscience & Agrochemical Intelligence
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Powered by PubChem & NCBI authoritative chemical databases. Inspect active ingredients, molecular structures, and chemical safety for fertilizers, pesticides, and soil amendments.
          </p>
        </div>

        <Link
          href={`/ai-assistant?prompt=${encodeURIComponent(
            `Explain the safe application rate, NPK timing, and safety precautions for ${selectedCompound?.title || 'Urea'} in wheat and vegetable farming.`
          )}`}
        >
          <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Sparkles className="h-4 w-4" />
            Consult Gemini on this Compound
          </Button>
        </Link>
      </div>

      {/* Quick Example Pill Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <FlaskConical className="h-3.5 w-3.5" /> Quick Explore:
        </span>
        {QUICK_EXAMPLES.map((ex) => (
          <button
            key={ex.name}
            onClick={() => {
              setSearchTerm(ex.name);
              fetchCompound(ex.name);
            }}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${
              selectedCompound?.title?.toLowerCase() === ex.name.toLowerCase()
                ? 'bg-teal-600 text-white border-teal-600 font-medium shadow-sm'
                : 'bg-background hover:bg-muted text-foreground border-border'
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Search Input Bar */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any agrochemical, fertilizer, fungicide, or active ingredient (e.g. Urea, Azadirachtin, Zinc Sulfate)..."
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white">
              {isLoading ? 'Searching...' : 'Explore Compound'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center space-y-2">
            <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold text-destructive">Compound Not Found</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchCompound('Urea')}>
              Reset to Urea
            </Button>
          </CardContent>
        </Card>
      ) : selectedCompound ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: 2D Structure & Identifiers */}
          <Card className="lg:col-span-1 flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-teal-700 border-teal-300 bg-teal-50">
                    PubChem CID: {selectedCompound.cid}
                  </Badge>
                  <Badge variant="secondary">
                    {selectedCompound.category}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold mt-2 font-headline">
                  {selectedCompound.title}
                </CardTitle>
                <CardDescription className="text-xs break-words">
                  {selectedCompound.iupacName}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 2D Molecular Depiction */}
                <div className="rounded-lg border bg-white p-4 flex flex-col items-center justify-center">
                  <span className="text-[11px] text-muted-foreground self-start mb-1 flex items-center gap-1">
                    <Atom className="h-3.5 w-3.5" /> 2D Skeletal Structure
                  </span>
                  <img
                    src={selectedCompound.structureImageUrl}
                    alt={`${selectedCompound.title} chemical structure`}
                    className="max-h-56 object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-[11px] text-muted-foreground mt-2 text-center">
                    Rendered directly via NCBI PubChem Depiction Server
                  </div>
                </div>

                {/* Provenance Badge */}
                <div className="p-3 rounded-md bg-muted/60 border border-muted text-xs space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Authoritative Provenance</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedCompound.provenance?.badge}
                  </p>
                  <a
                    href={selectedCompound.provenance?.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:underline pt-1"
                  >
                    View official NCBI record <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </div>

            <div className="p-4 pt-0">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 border-teal-300 hover:bg-teal-50 text-teal-800"
                onClick={handleSaveToFirestore}
                disabled={isSaved}
              >
                <Bookmark className="h-4 w-4" />
                {isSaved ? 'Saved to Your Firestore' : 'Save to My Farm Records'}
              </Button>
            </div>
          </Card>

          {/* Right Column: Physical & Chemical Properties & Action Insights */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Properties Grid */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Atom className="h-5 w-5 text-teal-600" />
                  Physicochemical Properties
                </CardTitle>
                <CardDescription>
                  Standard molecular descriptors critical for soil absorption, runoff risk, and foliar uptake.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <div className="text-xs text-muted-foreground">Molecular Formula</div>
                    <div className="text-base font-bold font-mono text-foreground mt-0.5">
                      {selectedCompound.molecularFormula || 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <div className="text-xs text-muted-foreground">Molecular Weight</div>
                    <div className="text-base font-bold font-mono text-foreground mt-0.5">
                      {selectedCompound.molecularWeight ? `${selectedCompound.molecularWeight} g/mol` : 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <div className="text-xs text-muted-foreground">Partition Coeff (XLogP)</div>
                    <div className="text-base font-bold font-mono text-foreground mt-0.5">
                      {selectedCompound.xlogp !== undefined ? selectedCompound.xlogp : 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <div className="text-xs text-muted-foreground">Complexity</div>
                    <div className="text-base font-bold font-mono text-foreground mt-0.5">
                      {selectedCompound.complexity ?? 'N/A'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <div className="text-xs text-muted-foreground">H-Bond Donors</div>
                    <div className="text-base font-bold font-mono text-foreground mt-0.5">
                      {selectedCompound.hBondDonorCount ?? 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <div className="text-xs text-muted-foreground">H-Bond Acceptors</div>
                    <div className="text-base font-bold font-mono text-foreground mt-0.5">
                      {selectedCompound.hBondAcceptorCount ?? 0}
                    </div>
                  </div>
                </div>

                {/* Canonical SMILES & InChIKey */}
                <div className="mt-4 space-y-2">
                  <div className="p-2.5 rounded-lg bg-muted/50 border font-mono text-xs">
                    <span className="text-muted-foreground font-sans block text-[11px] font-semibold mb-0.5">Canonical SMILES:</span>
                    <span className="text-foreground break-all">{selectedCompound.smiles || 'N/A'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50 border font-mono text-xs">
                    <span className="text-muted-foreground font-sans block text-[11px] font-semibold mb-0.5">InChIKey:</span>
                    <span className="text-foreground break-all">{selectedCompound.inchikey || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Synonyms & Trade Names */}
            {selectedCompound.synonyms && selectedCompound.synonyms.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sprout className="h-5 w-5 text-emerald-600" />
                    Common Agricultural Trade Names & Synonyms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompound.synonyms.map((syn: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs py-1 px-2.5 bg-background">
                        {syn}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Safe Agronomic Advisory & Gemini Deep Analysis Banner */}
            <Card className="border-teal-200 bg-gradient-to-r from-teal-50/70 to-emerald-50/70">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-teal-950 flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4 text-teal-700" />
                    Need dosage rates, soil compatibility, or organic alternatives?
                  </h4>
                  <p className="text-xs text-teal-900/80 max-w-xl">
                    Query our multi-model Gemini assistant with Search and Maps grounding to locate nearby agro-dealers and obtain specific field dosage guidelines.
                  </p>
                </div>
                <Link
                  href={`/ai-assistant?prompt=${encodeURIComponent(
                    `Provide a detailed agronomy summary for ${selectedCompound.title} (CID: ${selectedCompound.cid}). Include soil application guidelines, recommended timing for Kharif and Rabi seasons, compatibility with organic bio-fertilizers, and safety precautions.`
                  )}`}
                >
                  <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white whitespace-nowrap">
                    Analyze with Gemini
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
