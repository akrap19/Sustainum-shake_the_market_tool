import type { ReactNode } from "react";

export type PropsWithClassName = {
  className?: string;
};

export type BaseComponentProps = PropsWithClassName & {
  children?: ReactNode;
};
