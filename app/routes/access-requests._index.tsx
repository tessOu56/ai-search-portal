import { type LoaderFunctionArgs, redirect } from "react-router";
/**
 * Bare `/access-requests` is not a surface. Journey C review lives at
 * `/access-requests/review`. Preserve query (e.g. sessionRole) so demo
 * personas survive the hop.
 */
export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const target = new URL("/access-requests/review", url.origin);
  for (const [key, value] of url.searchParams.entries()) {
    target.searchParams.set(key, value);
  }
  return redirect(`${target.pathname}${target.search}`);
}

export default function AccessRequestsIndexRedirect() {
  return null;
}
