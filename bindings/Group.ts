// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { Addr } from "./Addr";

/**
 * An RFC5322 address group.
 */
export type Group = { 
/**
 * Group name
 */
name: string | null, 
/**
 * Addresses member of the group
 */
addresses: Array<Addr>, };
