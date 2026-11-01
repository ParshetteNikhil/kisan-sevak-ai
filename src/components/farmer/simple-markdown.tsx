'use client';

/** Tiny, safe renderer for AI answers: paragraphs, bullet lines and **bold**. No HTML injection. */
export default function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const bold = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part.replace(/\*/g, '')}</span>
    );
  return (
    <div className="selectable space-y-2 text-lg leading-relaxed">
      {lines.map((l, i) =>
        /^[-*•]\s+/.test(l) || /^\d+[.)]\s+/.test(l) ? (
          <p key={i} className="flex gap-2">
            <span className="text-primary">•</span>
            <span>{bold(l.replace(/^([-*•]|\d+[.)])\s+/, ''))}</span>
          </p>
        ) : /^#+\s/.test(l) ? (
          <p key={i} className="text-xl font-bold">{bold(l.replace(/^#+\s/, ''))}</p>
        ) : (
          <p key={i}>{bold(l)}</p>
        )
      )}
    </div>
  );
}
