// hooks/useAuth.js
import useSWR from 'swr';

async function fetcher(route: any) {
  /* our token cookie gets sent with this request */
  return await fetch(route)
    .then((r) => r.ok && r.json())
    .then((user) => user || null);
}

export default function useAuth() {
  const { data: user, error, mutate } = useSWR('/api/magicLink/user', fetcher);
  const loading = user === undefined;

  return {
    user,
    loading,
    error,
  };
}
