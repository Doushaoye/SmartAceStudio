export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-4 text-sm">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') return null;

        if (trimmedLine.startsWith('### ')) {
          return <h4 key={index} className="text-base font-semibold pt-3 font-headline">{trimmedLine.substring(4)}</h4>;
        }
        if (trimmedLine.startsWith('## ')) {
          return <h3 key={index} className="text-lg font-semibold pt-4 font-headline">{trimmedLine.substring(3)}</h3>;
        }
        if (trimmedLine.startsWith('# ')) {
          return <h2 key={index} className="text-xl font-bold pt-5 font-headline">{trimmedLine.substring(2)}</h2>;
        }
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          return <li key={index} className="list-disc ml-5">{trimmedLine.substring(2)}</li>;
        }
        if (trimmedLine.match(/^\d+\.\s/)) {
            return <li key={index} className="list-decimal ml-5">{trimmedLine.replace(/^\d+\.\s/, '')}</li>;
        }
        
        const segments = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);

        return (
            <p key={index} className="text-muted-foreground leading-relaxed">
                {segments.map((segment, i) => {
                    if (segment.startsWith('**') && segment.endsWith('**')) {
                        return <strong key={i} className="font-medium text-foreground">{segment.slice(2, -2)}</strong>;
                    }
                    return segment;
                })}
            </p>
        );
      })}
    </div>
  );
}
