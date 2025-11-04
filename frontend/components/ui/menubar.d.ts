import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
declare const MenubarMenu: {
    (props: MenubarPrimitive.MenubarMenuProps & {
        __scopeMenubar?: import("@radix-ui/react-context").Scope;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
declare const MenubarGroup: import("react").ForwardRefExoticComponent<MenubarPrimitive.MenubarGroupProps & import("react").RefAttributes<HTMLDivElement>>;
declare const MenubarPortal: import("react").FC<MenubarPrimitive.MenubarPortalProps>;
declare const MenubarSub: import("react").FC<MenubarPrimitive.MenubarSubProps>;
declare const MenubarRadioGroup: import("react").ForwardRefExoticComponent<MenubarPrimitive.MenubarRadioGroupProps & import("react").RefAttributes<HTMLDivElement>>;
declare const Menubar: React.ForwardRefExoticComponent<Omit<MenubarPrimitive.MenubarProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const MenubarTrigger: React.ForwardRefExoticComponent<Omit<MenubarPrimitive.MenubarTriggerProps & import("react").RefAttributes<HTMLButtonElement>, "ref"> & React.RefAttributes<HTMLButtonElement>>;
declare const MenubarSubTrigger: React.ForwardRefExoticComponent<Omit<MenubarPrimitive.MenubarSubTriggerProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>;
declare const MenubarSubContent: React.ForwardRefExoticComponent<Omit<MenubarPrimitive.MenubarSubContentProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const MenubarContent: React.ForwardRefExoticComponent<Omit<MenubarPrimitive.MenubarContentProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const MenubarItem: React.ForwardRefExoticComponent<Omit<MenubarPrimitive.MenubarItemProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>;
declare const MenubarCheckboxItem: React.ForwardRefExoticComponent<Omit<MenubarPrimitive.MenubarCheckboxItemProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const MenubarRadioItem: React.ForwardRefExoticComponent<Omit<MenubarPrimitive.MenubarRadioItemProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const MenubarLabel: React.ForwardRefExoticComponent<Omit<MenubarPrimitive.MenubarLabelProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>;
declare const MenubarSeparator: React.ForwardRefExoticComponent<Omit<MenubarPrimitive.MenubarSeparatorProps & import("react").RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare const MenubarShortcut: {
    ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>): import("react/jsx-runtime").JSX.Element;
    displayname: string;
};
export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarLabel, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem, MenubarPortal, MenubarSubContent, MenubarSubTrigger, MenubarGroup, MenubarSub, MenubarShortcut, };
