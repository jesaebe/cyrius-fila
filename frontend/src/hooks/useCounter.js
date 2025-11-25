export function useCounter() {
  const key = "selectedCounter";

  return {
    get: () => JSON.parse(localStorage.getItem(key)),
    set: (counter) => localStorage.setItem(key, JSON.stringify(counter)),
    clear: () => localStorage.removeItem(key)
  };
}
