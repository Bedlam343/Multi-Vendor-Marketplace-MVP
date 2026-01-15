import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string[];
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = "", ...props }, ref) => {
        return (
            <div className="space-y-1">
                {label && (
                    <label
                        htmlFor={props.id}
                        className="block text-sm font-medium text-slate-700"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        className={`
                        appearance-none block w-full px-3 py-2 
                        border border-slate-300 rounded-lg shadow-sm 
                        placeholder-slate-400 
                        focus:outline-none focus:ring-1 
                        focus:ring-slate-900 focus:border-slate-900 
                        sm:text-sm transition-colors
                        disabled:opacity-50 disabled:bg-slate-50
                        text-primary
                        ${
                            error
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                : ""
                        }
                        ${className}
            `}
                        {...props}
                    />
                </div>
                {error && (
                    <p
                        className="text-xs text-red-600 animate-pulse"
                        role="alert"
                    >
                        {error[0]}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
