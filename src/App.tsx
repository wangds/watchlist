import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { WatchlistDbItem } from "../database";
import EditScriptView from "./EditScriptView";
import HintView from "./HintView";
import InsertItemView from "./InsertItemView";
import NavbarView, { EditScriptPage } from "./NavbarView";
import WatchlistView from "./WatchlistView";
import "./App.css";

/**
 * Results of a fetch request, persists across renders.
 * Key: url
 * Value: fetch result, or undefined if fetch in progress
 */
type Cache = Record<string, object | undefined>;

function App(): ReactNode {
  const cacheRef = useRef<Cache>({});
  const [items, setItems] = useState<WatchlistDbItem[]>([]);

  const currentPage = new URL(document.URL).pathname;

  useEffect(() => {
    fetchCached(cacheRef, "/api/items", (res) => {
      setItems(res as WatchlistDbItem[]);
    });
  }, []);

  const navbar = <NavbarView currentPage={currentPage} />;

  if (currentPage === EditScriptPage) {
    return (
      <>
        {navbar}
        <div className="grid">
          <div className="card">
            <EditScriptView items={items} />
          </div>
          <div className="card">
            <HintView />
          </div>
        </div>
      </>
    );
  } else {
    return (
      <>
        {navbar}
        <WatchlistView items={items} setItems={setItems} />
        <div className="card">
          <InsertItemView items={items} setItems={setItems} />
        </div>
      </>
    );
  }
}

/**
 * Helper function to fetch external data asynchronously from useEffect().
 * Persists the fetch result into cacheRef.
 */
function fetchCached(
  cacheRef: RefObject<Cache>,
  url: string,
  callback: (res: object) => void,
): void {
  async function fetchJson(): Promise<object> {
    if (!(url in cacheRef.current)) {
      cacheRef.current[url] = undefined;
      const res = await fetch(url);
      cacheRef.current[url] = (await res.json()) as object;
    }

    // React strict mode calls the API twice in development mode.  If the first
    // fetch was started but has not yet finished, the second fetch will wait
    // for it to complete here instead of making a second request.
    while (cacheRef.current[url] === undefined) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return cacheRef.current[url];
  }

  fetchJson()
    .then((res) => {
      callback(res);
    })
    .catch((err: unknown) => {
      console.error(err);
    });
}

export default App;
