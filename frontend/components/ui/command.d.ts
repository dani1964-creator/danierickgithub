import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
declare const Command: React.ForwardRefExoticComponent<Omit<{
    children?: import("react").ReactNode;
} & Pick<Pick<import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof import("react").HTMLAttributes<HTMLDivElement>> & {
    ref?: import("react").Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "key" | keyof import("react").HTMLAttributes<HTMLDivElement> | "asChild"> & {
    label?: string;
    shouldFilter?: boolean;
    filter?: (value: string, search: string, keywords?: string[]) => number;
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    loop?: boolean;
    disablePointerSelection?: boolean;
    vimBindings?: boolean;
} & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
type CommandDialogProps = DialogProps;
declare const CommandDialog: ({ children, ...props }: CommandDialogProps) => import("react/jsx-runtime").JSX.Element;
declare const CommandInput: React.ForwardRefExoticComponent<Omit<Omit<Pick<Pick<import("react").DetailedHTMLProps<import("react").InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "key" | keyof import("react").InputHTMLAttributes<HTMLInputElement>> & {
    ref?: import("react").Ref<HTMLInputElement>;
} & {
    asChild?: boolean;
}, "key" | "asChild" | keyof import("react").InputHTMLAttributes<HTMLInputElement>>, "type" | "onChange" | "value"> & {
    value?: string;
    onValueChange?: (search: string) => void;
} & import("react").RefAttributes<HTMLInputElement>, "ref"> & React.RefAttributes<HTMLInputElement>>;
declare const CommandList: React.ForwardRefExoticComponent<Omit<{
    children?: import("react").ReactNode;
} & Pick<Pick<import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof import("react").HTMLAttributes<HTMLDivElement>> & {
    ref?: import("react").Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "key" | keyof import("react").HTMLAttributes<HTMLDivElement> | "asChild"> & {
    label?: string;
} & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CommandEmpty: React.ForwardRefExoticComponent<Omit<{
    children?: import("react").ReactNode;
} & Pick<Pick<import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof import("react").HTMLAttributes<HTMLDivElement>> & {
    ref?: import("react").Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "key" | keyof import("react").HTMLAttributes<HTMLDivElement> | "asChild"> & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CommandGroup: React.ForwardRefExoticComponent<Omit<{
    children?: import("react").ReactNode;
} & Omit<Pick<Pick<import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof import("react").HTMLAttributes<HTMLDivElement>> & {
    ref?: import("react").Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "key" | keyof import("react").HTMLAttributes<HTMLDivElement> | "asChild">, "value" | "heading"> & {
    heading?: import("react").ReactNode;
    value?: string;
    forceMount?: boolean;
} & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CommandSeparator: React.ForwardRefExoticComponent<Omit<Pick<Pick<import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof import("react").HTMLAttributes<HTMLDivElement>> & {
    ref?: import("react").Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "key" | keyof import("react").HTMLAttributes<HTMLDivElement> | "asChild"> & {
    alwaysRender?: boolean;
} & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CommandItem: React.ForwardRefExoticComponent<Omit<{
    children?: import("react").ReactNode;
} & Omit<Pick<Pick<import("react").DetailedHTMLProps<import("react").HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "key" | keyof import("react").HTMLAttributes<HTMLDivElement>> & {
    ref?: import("react").Ref<HTMLDivElement>;
} & {
    asChild?: boolean;
}, "key" | keyof import("react").HTMLAttributes<HTMLDivElement> | "asChild">, "onSelect" | "value" | "disabled"> & {
    disabled?: boolean;
    onSelect?: (value: string) => void;
    value?: string;
    keywords?: string[];
    forceMount?: boolean;
} & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const CommandShortcut: {
    ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator, };
