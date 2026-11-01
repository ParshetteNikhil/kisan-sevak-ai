'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Loader2,
  Bot,
  User,
  Mic,
  Volume2,
  Pause,
  Play,
  Search,
  MapPin,
  Sparkles,
  Zap,
  BrainCircuit,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFarmContextText } from '@/hooks/use-soil-baseline';
import { useI18n } from '@/hooks/use-i18n';
import { BusyCard } from '@/components/farmer/busy-card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-provider';
import { ListenButton } from '@/components/voice/listen-button';
import { Feedback } from '@/components/farmer/feedback';
import SimpleMarkdown from '@/components/farmer/simple-markdown';
import { useFarmProfile } from '@/hooks/use-farm-profile';
import { track } from '@/lib/analytics';
import { SPEECH_LANG } from '@/lib/speech';

/** Uses web search for prices, schemes and weather; maps for "near me" questions. */
function autoGrounding(text: string): 'none' | 'search' | 'maps' {
  const q = text.toLowerCase();
  if (/(near|nearest|nearby|पास|नज़दीक|नजदीक|जवळ|దగ్గర|அருகில்|ಹತ್ತಿರ|কাছে|નજીક|ਨੇੜੇ)/.test(q)) return 'maps';
  if (/(price|rate|mandi|msp|scheme|yojana|subsidy|weather|rain|भाव|मंडी|दाम|रेट|योजना|सब्सिडी|मौसम|बारिश|बाजार|ధర|మార్కెట్|பதில்|விலை|ಬೆಲೆ|দাম|ભાવ|ਭਾਅ|ਮੰਡੀ)/.test(q)) return 'search';
  return 'none';
}
import { db, handleFirestoreError, OperationType, getIdTokenOrThrow } from '@/lib/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type SpeechState = 'idle' | 'speaking' | 'paused';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  modelUsed?: string;
  groundingUsed?: 'none' | 'search' | 'maps';
  searchCitations?: { title: string; uri: string }[];
  mapLocations?: { title: string; uri: string; snippet?: string }[];
  timestamp?: string;
}

export default function AiAssistantClient() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatFailed, setChatFailed] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [modelTier, setModelTier] = useState<'fast' | 'general' | 'complex'>('general');
  const [selectedRole, setSelectedRole] = useState<'agronomist' | 'market_strategist' | 'bioscience_specialist' | 'soil_expert'>('agronomist');
  const [groundingMode, setGroundingMode] = useState<'none' | 'search' | 'maps'>('none');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const { toast } = useToast();
  const { t, locale } = useI18n();
  const { profile: farmProfile } = useFarmProfile();
  const farmCtx = useFarmContextText(farmProfile);
  const { user } = useAuth();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [speechSynthesisVoice, setSpeechSynthesisVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [activeSpeech, setActiveSpeech] = useState<{ id: string; state: SpeechState } | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-scroll on message updates
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  // Handle URL query parameter pre-fill (from Bioscience page)
  useEffect(() => {
    const promptParam = searchParams.get('prompt');
    if (promptParam) {
      setInput(promptParam);
    }
  }, [searchParams]);

  // Request browser geolocation for Google Maps Grounding
  useEffect(() => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          // Default fallback coordinates (e.g., Central India / New Delhi agricultural corridor)
          setUserLocation({ latitude: 28.6139, longitude: 77.209 });
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Sync / Load chat messages from Firestore if authenticated
  useEffect(() => {
    if (!user) {
      // Default welcome message for guests
      if (messages.length === 0) {
        setMessages([
          {
            id: 'msg-welcome',
            role: 'model',
            content: `${t('greeting_guest')} ${t('tile_ask_sub')}. ${t('speak_example').split(':')[0]} 🎤`,
            modelUsed: 'gemini-3.8-flash',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      return;
    }

    const messagesCol = collection(db, 'users', user.uid, 'chat_messages');
    const unsubscribe = onSnapshot(
      messagesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: ChatMessageItem[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ChatMessageItem, 'id'>),
          }));
          loaded.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
          setMessages(loaded);
        } else {
          setMessages([
            {
              id: 'msg-welcome',
              role: 'model',
              content: `${t('greeting', { name: (user.displayName || '').split(' ')[0] })} ${t('tile_ask_sub')} 🎤`,
              modelUsed: 'gemini-3.8-flash',
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/chat_messages`);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Speech Recognition & Voice Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = SPEECH_LANG[locale] || 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const currentLangVoices = voices.filter((v) => v.lang.startsWith(locale));
        const femaleVoice =
          currentLangVoices.find((voice) => voice.name.includes('Female')) ||
          currentLangVoices.find((voice) => (voice as any).gender === 'female');
        setSpeechSynthesisVoice(femaleVoice || currentLangVoices[0] || voices[0]);
      }
    };

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setVoice();
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
  }, [locale]);

  const handleListen = () => {
    if (!recognitionRef.current) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'Speech recognition is not supported in this browser.',
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSpeak = (messageId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: 'Text-to-speech is not supported in this browser.',
      });
      return;
    }

    if (activeSpeech && activeSpeech.id === messageId) {
      if (activeSpeech.state === 'speaking') {
        window.speechSynthesis.pause();
        setActiveSpeech({ id: messageId, state: 'paused' });
      } else if (activeSpeech.state === 'paused') {
        window.speechSynthesis.resume();
        setActiveSpeech({ id: messageId, state: 'speaking' });
      }
    } else {
      window.speechSynthesis.cancel();
      // Strip markdown syntax for natural voice synthesis
      const cleanText = text.replace(/[*#_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;

      if (speechSynthesisVoice) {
        utterance.voice = speechSynthesisVoice;
      }
      utterance.lang = locale;

      utterance.onend = () => setActiveSpeech(null);
      utterance.onerror = () => setActiveSpeech(null);

      window.speechSynthesis.speak(utterance);
      setActiveSpeech({ id: messageId, state: 'speaking' });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');

    const userMsgId = `usr_${Date.now()}`;
    const userMessage: ChatMessageItem = {
      id: userMsgId,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);
    setChatFailed(false);

    // Save user turn to Firestore if signed in
    if (user) {
      try {
        const userMsgRef = doc(db, 'users', user.uid, 'chat_messages', userMsgId);
        await setDoc(userMsgRef, {
          id: userMsgId,
          userId: user.uid,
          role: 'user',
          content: userText,
          timestamp: userMessage.timestamp,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/chat_messages/${userMsgId}`);
      }
    }

    try {
      // Build conversation history for API
      const historyPayload = messages
        .filter((m) => m.id !== 'msg-welcome')
        .slice(-10)
        .map((m) => ({
          role: m.role,
          text: m.content,
        }));

      const idToken = await getIdTokenOrThrow();
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          message: userText,
          history: historyPayload,
          modelTier,
          role: selectedRole,
          grounding: autoGrounding(userText),
          farmContext: farmCtx || undefined,
          userLocation,
          locale,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to receive response from Gemini');
      }

      const botMsgId = `bot_${Date.now()}`;
      const botMessage: ChatMessageItem = {
        id: botMsgId,
        role: 'model',
        content: data.text || 'I have analyzed your request.',
        modelUsed: data.modelUsed,
        groundingUsed: data.groundingUsed,
        searchCitations: data.searchCitations || [],
        mapLocations: data.mapLocations || [],
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMessage]);
      track('ask_expert', { grounding: autoGrounding(userText) });

      // Save bot turn to Firestore if signed in
      if (user) {
        try {
          const botMsgRef = doc(db, 'users', user.uid, 'chat_messages', botMsgId);
          await setDoc(botMsgRef, {
            id: botMsgId,
            userId: user.uid,
            role: 'model',
            content: botMessage.content,
            modelUsed: botMessage.modelUsed,
            groundingType: botMessage.groundingUsed || 'none',
            timestamp: botMessage.timestamp,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/chat_messages/${botMsgId}`);
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setChatFailed(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg-welcome',
        role: 'model',
        content: `${t('greeting_guest')} ${t('tile_ask_sub')} 🎤`,
        modelUsed: 'gemini-3.8-flash',
        timestamp: new Date().toISOString(),
      },
    ]);
    toast({ title: '✓' });
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-14rem)] max-w-5xl mx-auto shadow-sm border">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b p-3">
        <p className="text-base text-muted-foreground">{t('tile_ask_sub')}</p>
        <Button variant="ghost" size="sm" onClick={handleClearHistory} className="h-10 gap-1 text-base text-muted-foreground">
          <Trash2 className="h-5 w-5" />
        </Button>
      </CardHeader>

      {/* Messages Scroll Area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div key={message.id} className={cn('flex items-start gap-3', isUser ? 'justify-end' : 'justify-start')}>
                  {!isUser && (
                    <Avatar className="h-8 w-8 border bg-emerald-600 text-white shrink-0 mt-0.5">
                      <AvatarFallback className="bg-emerald-600 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn('max-w-[85%] space-y-2', isUser ? 'items-end' : 'items-start')}>
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-3 text-base shadow-xs',
                        isUser ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted/70 text-foreground rounded-tl-none border'
                      )}
                    >
                      {/* Message Content */}
                      {isUser ? (
                        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                      ) : (
                        <SimpleMarkdown text={message.content} />
                      )}
                      {!isUser && message.id !== 'msg-welcome' && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <ListenButton text={message.content} className="h-10" />
                        </div>
                      )}

                      {/* Search Grounding Citations */}
                      {message.searchCitations && message.searchCitations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-border/50 text-xs">
                          <span className="font-semibold text-[11px] text-blue-700 dark:text-blue-400 flex items-center gap-1 mb-1.5">
                            <Search className="h-3 w-3" /> 🔗
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {message.searchCitations.map((chunk, idx) => (
                              <a
                                key={idx}
                                href={chunk.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background/80 hover:bg-background border text-[11px] text-blue-600 hover:underline max-w-xs truncate"
                              >
                                <span className="truncate">{chunk.title}</span>
                                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Google Maps Grounding Place Cards */}
                      {message.mapLocations && message.mapLocations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-border/50 text-xs">
                          <span className="font-semibold text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1.5">
                            <MapPin className="h-3 w-3" /> Nearby Places on Google Maps:
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {message.mapLocations.map((loc, idx) => (
                              <a
                                key={idx}
                                href={loc.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded bg-background/90 hover:bg-background border text-xs text-foreground flex items-center justify-between gap-2 group transition-colors"
                              >
                                <div className="truncate">
                                  <div className="font-medium text-emerald-700 group-hover:underline flex items-center gap-1 truncate">
                                    {loc.title}
                                  </div>
                                  {loc.snippet && <div className="text-[11px] text-muted-foreground truncate">{loc.snippet}</div>}
                                </div>
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Controls Footer for Message */}
                    <div className={cn('flex items-center gap-2 text-[11px] text-muted-foreground px-1', isUser ? 'justify-end' : 'justify-start')}>
                      {!isUser && message.modelUsed && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                          {message.modelUsed}
                        </Badge>
                      )}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleSpeak(message.id, message.content)}
                          className="hover:text-foreground flex items-center gap-0.5 transition-colors"
                        >
                          {activeSpeech?.id === message.id && activeSpeech.state === 'speaking' ? (
                            <>
                              <Pause className="h-3 w-3 text-emerald-600 animate-pulse" /> Speaking...
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3 w-3" /> Listen
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <Avatar className="h-8 w-8 border shrink-0 mt-0.5">
                      <AvatarImage src={user?.photoURL || undefined} alt="User" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}

            {!isLoading && messages.length > 1 && messages[messages.length - 1].role === 'model' && (
              <Feedback key={messages[messages.length - 1].id} feature="ask_expert" />
            )}

            {chatFailed && !isLoading && <BusyCard />}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 border bg-emerald-600 text-white shrink-0 mt-0.5">
                  <AvatarFallback className="bg-emerald-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-2xl rounded-tl-none bg-muted/60 border flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>
                    {t('checking')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input Form Footer */}
      <CardFooter className="p-3 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tile_ask_sub')}
            disabled={isLoading}
            className="h-14 flex-1 text-lg"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleListen}
            disabled={isLoading}
            className={cn('h-14 w-14 shrink-0 bg-primary text-primary-foreground', isListening && 'animate-pulse')}
            title={t('speak')}
          >
            <Mic className="h-7 w-7" />
          </Button>

          <Button type="submit" disabled={isLoading || !input.trim()} className="h-14 w-14 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
