import { cn } from "@/lib/utils"

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-200 p-6", className)}>
            {children}
        </div>
    )
}
