import { Providers } from "../providers";
import Header from "@/components/Header";
import DemoHelper from "@/components/DemoHelper";
import { ArticleProvider } from "@/context/ArticleContext";
import { ToastProvider } from "@/context/ToastContext";

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <ToastProvider>
        <ArticleProvider>
          <Header />
          {children}
          <DemoHelper />
        </ArticleProvider>
      </ToastProvider>
    </Providers>
  );
}
