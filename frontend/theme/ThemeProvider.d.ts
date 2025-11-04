import type { BrokerProfile } from '@src/types/broker';
type Props = {
    broker?: Partial<BrokerProfile> | null;
    children: React.ReactNode;
};
export declare function ThemeProvider({ broker, children }: Props): import("react/jsx-runtime").JSX.Element;
export {};
