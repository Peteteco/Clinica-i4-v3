import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Sparkles } from "lucide-react";

interface LimitAlertProps {
  current: number;
  max: number;
  limitName: string;
  onUpgrade?: () => void;
}

export function LimitAlert({ current, max, limitName, onUpgrade }: LimitAlertProps) {
  const percentUsed = (current / max) * 100;
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = current >= max;

  if (!isNearLimit) return null;

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isAtLimit ? "Limite Atingido!" : "Próximo do Limite"}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          Você está usando <strong>{current}</strong> de <strong>{max}</strong> {limitName}.
          {isAtLimit && " Para criar mais, faça upgrade do seu plano."}
        </p>
        {onUpgrade && (
          <Button
            size="sm"
            onClick={onUpgrade}
            className="mt-2 gap-2"
            variant={isAtLimit ? "default" : "outline"}
          >
            <Sparkles className="h-3 w-3" />
            Ver Planos
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}


