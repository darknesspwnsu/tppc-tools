"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PersistedEnvelope<T> = {
  version: number;
  data: T;
};

type PersistentOptionsConfig<T> = {
  version: number;
  migrate?: (raw: unknown) => T;
};

function mergeWithDefaults<T extends object>(defaults: T, candidate: unknown): T {
  if (!candidate || typeof candidate !== "object") return defaults;
  return { ...defaults, ...(candidate as Partial<T>) };
}

export function usePersistentOptions<T extends object>(
  storageKey: string,
  defaults: T,
  options?: PersistentOptionsConfig<T>
): [T, (patch: Partial<T>) => void, boolean] {
  const version = options?.version ?? 1;
  const migrate = options?.migrate;

  const defaultsRef = useRef(defaults);
  const migrateRef = useRef(migrate);
  const stableDefaults = defaultsRef.current;
  const [state, setState] = useState<T>(stableDefaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    migrateRef.current = migrate;
  }, [migrate]);

  useEffect(() => {
    let next = stableDefaults;
    const migrateFn = migrateRef.current;

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;

        if (
          parsed &&
          typeof parsed === "object" &&
          "version" in parsed &&
          "data" in parsed
        ) {
          const env = parsed as PersistedEnvelope<unknown>;
          if (env.version === version) {
            next = mergeWithDefaults(stableDefaults, env.data);
          } else if (migrateFn) {
            next = mergeWithDefaults(stableDefaults, migrateFn(env.data));
          }
        } else if (migrateFn) {
          next = mergeWithDefaults(stableDefaults, migrateFn(parsed));
        }
      }
    } catch {
      next = stableDefaults;
    }

    setState(next);
    setLoaded(true);
  }, [stableDefaults, storageKey, version]);

  useEffect(() => {
    if (!loaded) return;

    try {
      const payload: PersistedEnvelope<T> = {
        version,
        data: state
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore storage write errors (private mode, quotas, etc.)
    }
  }, [loaded, state, storageKey, version]);

  const patchState = useCallback((patch: Partial<T>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return [state, patchState, loaded];
}
