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

type ResolvePersistentOptionsStateArgs<T extends object> = {
  defaults: T;
  rawStorageValue: string | null;
  version: number;
  migrate?: (raw: unknown) => T;
  pendingPatch?: Partial<T> | null;
};

export function resolvePersistentOptionsState<T extends object>({
  defaults,
  rawStorageValue,
  version,
  migrate,
  pendingPatch
}: ResolvePersistentOptionsStateArgs<T>): T {
  let next = defaults;

  try {
    if (rawStorageValue) {
      const parsed = JSON.parse(rawStorageValue) as unknown;

      if (
        parsed &&
        typeof parsed === "object" &&
        "version" in parsed &&
        "data" in parsed
      ) {
        const env = parsed as PersistedEnvelope<unknown>;
        if (env.version === version) {
          next = mergeWithDefaults(defaults, env.data);
        } else if (migrate) {
          next = mergeWithDefaults(defaults, migrate(env.data));
        }
      } else if (migrate) {
        next = mergeWithDefaults(defaults, migrate(parsed));
      }
    }
  } catch {
    next = defaults;
  }

  if (pendingPatch && typeof pendingPatch === "object") {
    next = { ...next, ...pendingPatch };
  }

  return next;
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
  const loadedRef = useRef(false);
  const pendingPatchRef = useRef<Partial<T> | null>(null);
  const stableDefaults = defaultsRef.current;
  const [state, setState] = useState<T>(stableDefaults);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    migrateRef.current = migrate;
  }, [migrate]);

  useEffect(() => {
    loadedRef.current = loaded;
  }, [loaded]);

  useEffect(() => {
    const next = resolvePersistentOptionsState<T>({
      defaults: stableDefaults,
      rawStorageValue: localStorage.getItem(storageKey),
      version,
      migrate: migrateRef.current,
      pendingPatch: pendingPatchRef.current
    });

    pendingPatchRef.current = null;
    setState(next);
    loadedRef.current = true;
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
    if (!loadedRef.current) {
      pendingPatchRef.current = {
        ...(pendingPatchRef.current || {}),
        ...patch
      };
    }
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return [state, patchState, loaded];
}
