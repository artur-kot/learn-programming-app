import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Component } from "svelte";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Props<T extends Record<string, any> = Record<string, any>> = T;

export type WithElementRef<T extends Props = Props> = T & {
	ref?: T extends { ref?: infer R } ? R : HTMLElement | null;
};

export type WithChild<T extends Props = Props> = T & {
	child?: Component;
};

export type WithChildren<T extends Props = Props> = T & {
	children?: Component;
};

export type WithAsChild<T extends Props = Props> = T & {
	asChild?: boolean;
};

export type WithoutChild<T extends Props> = Omit<T, "child">;
export type WithoutChildren<T extends Props> = Omit<T, "children">;
export type WithoutChildrenOrChild<T extends Props> = Omit<T, "children" | "child">;
