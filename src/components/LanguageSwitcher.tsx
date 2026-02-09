import { Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(lng === "en" ? "Language set to English" : "Språk satt til Norsk (Bokmål)");
  };

  const currentLang = i18n.language;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage("nb")} className="flex items-center justify-between">
          Norsk (Bokmål)
          {currentLang === "nb" && <Check className="h-4 w-4 ml-2 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("en")} className="flex items-center justify-between">
          English
          {currentLang === "en" && <Check className="h-4 w-4 ml-2 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
