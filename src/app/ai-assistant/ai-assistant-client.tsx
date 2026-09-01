'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Bot, User, Mic, Volume2, Pause, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/hooks/use-i18n';
import { getChatResponse } from './actions';
import type { ChatMessage } from '@/ai/flows/agri-chat-flow';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/use-profile';

// SpeechRecognition might not be available on the window object type
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type SpeechState = 'idle' | 'speaking' | 'paused';

export default function AiAssistantClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const { profile } = useProfile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [speechSynthesisVoice, setSpeechSynthesisVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [activeSpeech, setActiveSpeech] = useState<{ id: number; state: SpeechState } | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = locale;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        toast({ variant: 'destructive', title: t('error'), description: `Speech recognition error: ${event.error}` });
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const currentLangVoices = voices.filter(v => v.lang.startsWith(locale));
            // Prefer a female voice
            const femaleVoice = currentLangVoices.find(voice => voice.name.includes('Female')) || currentLangVoices.find(voice => voice.gender === 'female');
            setSpeechSynthesisVoice(femaleVoice || currentLangVoices[0] || voices[0]);
        }
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
       setVoice();
       // Voices are loaded asynchronously
       window.speechSynthesis.onvoiceschanged = setVoice;
    }

  }, [toast, t, locale]);

  const handleListen = () => {
    if (!recognitionRef.current) {
        toast({ variant: 'destructive', title: t('error'), description: 'Speech recognition is not supported in this browser.' });
        return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSpeak = (text: string, messageIndex: number) => {
    if (!('speechSynthesis' in window)) {
        toast({ variant: 'destructive', title: t('error'), description: 'Text-to-speech is not supported in this browser.' });
        return;
    }
    
    // If this message is already speaking/paused, handle pause/resume
    if (activeSpeech && activeSpeech.id === messageIndex) {
        if (activeSpeech.state === 'speaking') {
            window.speechSynthesis.pause();
            setActiveSpeech({ id: messageIndex, state: 'paused' });
        } else if (activeSpeech.state === 'paused') {
            window.speechSynthesis.resume();
            setActiveSpeech({ id: messageIndex, state: 'speaking' });
        }
        return;
    }

    // Stop any previous speech
    window.speechSynthesis.cancel();

    // Create and speak new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (speechSynthesisVoice) {
        utterance.voice = speechSynthesisVoice;
    }
    utterance.lang = locale;
    utterance.rate = 0.85; // A calmer, slower rate
    utterance.pitch = 1;
    
    utterance.onend = () => {
        setActiveSpeech(null);
        utteranceRef.current = null;
    };
    
    window.speechSynthesis.speak(utterance);
    setActiveSpeech({ id: messageIndex, state: 'speaking' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getChatResponse([...messages, userMessage], input, locale);
      const aiMessage: ChatMessage = { role: 'model', content: response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI chat response:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('ai_suggestion_error'),
      });
       setMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSpeakIcon = (messageIndex: number) => {
    if (activeSpeech && activeSpeech.id === messageIndex) {
        if (activeSpeech.state === 'speaking') {
            return <Pause className="h-4 w-4" />;
        } else if (activeSpeech.state === 'paused') {
            return <Play className="h-4 w-4" />;
        }
    }
    return <Volume2 className="h-4 w-4" />;
  };

  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Bot /> {t('agri_chat_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>{t('ask_agri_chat_placeholder')}</p>
                </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'model' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'p-3 rounded-lg max-w-sm whitespace-pre-wrap group relative',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                   {message.role === 'model' && (
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                       onClick={() => handleSpeak(message.content, index)}
                     >
                       {getSpeakIcon(index)}
                       <span className="sr-only">Speak</span>
                     </Button>
                   )}
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback><User size={20} /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                 <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                  </Avatar>
                 <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('thinking')}...</span>
                 </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            id="message"
            placeholder={isListening ? 'Listening...' : t('ask_anything_placeholder')}
            className="flex-1"
            autoComplete="off"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
          />
           <Button type="button" size="icon" variant={isListening ? 'destructive': 'outline'} onClick={handleListen} disabled={isLoading}>
            <Mic className="h-4 w-4" />
            <span className="sr-only">Use Microphone</span>
          </Button>
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
            <span className="sr-only">{t('send_message')}</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
