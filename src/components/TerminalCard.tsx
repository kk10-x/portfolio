import { siteConfig } from "@/config/site";

export function TerminalCard({ building }: { building?: string }) {
  return (
    <div className="terminal-float w-full max-w-md rounded-2xl border border-indigo-100 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md shadow-xl shadow-indigo-500/15 dark:shadow-indigo-500/10 overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-indigo-100 dark:border-neutral-800 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-3 text-xs font-mono text-neutral-400 dark:text-neutral-500">
          khrithik@portfolio ~
        </span>
      </div>
      <pre className="p-5 text-[13px] leading-6 font-mono text-neutral-700 dark:text-neutral-300 overflow-x-auto">
        <code>
          <span className="text-fuchsia-500 dark:text-fuchsia-400">$</span>{" "}
          whoami{"\n"}
          {"{"}
          {"\n"}
          {"  "}role:{" "}
          <span className="text-indigo-500 dark:text-indigo-400">
            &quot;{siteConfig.role}&quot;
          </span>
          ,{"\n"}
          {"  "}at:{" "}
          <span className="text-indigo-500 dark:text-indigo-400">
            &quot;Razorpay&quot;
          </span>
          ,{"\n"}
          {"  "}base:{" "}
          <span className="text-indigo-500 dark:text-indigo-400">
            &quot;Bengaluru, IN&quot;
          </span>
          ,{"\n"}
          {"  "}stack: [
          <span className="text-cyan-600 dark:text-cyan-400">
            &quot;Python&quot;
          </span>
          ,{" "}
          <span className="text-cyan-600 dark:text-cyan-400">
            &quot;TypeScript&quot;
          </span>
          ,{" "}
          <span className="text-cyan-600 dark:text-cyan-400">
            &quot;React&quot;
          </span>
          ],{"\n"}
          {building && (
            <>
              {"  "}building:{" "}
              <span className="text-emerald-600 dark:text-emerald-400">
                &quot;{building}&quot;
              </span>
              ,{"\n"}
            </>
          )}
          {"  "}coffee:{" "}
          <span className="text-fuchsia-500 dark:text-fuchsia-400">true</span>
          {"\n"}
          {"}"}
        </code>
      </pre>
    </div>
  );
}
