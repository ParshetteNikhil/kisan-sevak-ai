import { Leaf } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2" title="Kisaan Sevak">
      <div className="p-1.5 bg-primary/20 rounded-lg">
         <Leaf className="h-6 w-6 text-primary" />
      </div>
      <span className="text-xl font-bold font-headline text-primary">
        Kisaan Sevak
      </span>
    </div>
  );
}
