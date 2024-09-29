import { ReactNode, useEffect, useState } from "react";
import { WatchlistDbItem } from "../database";
import WatchlistView from "./WatchlistView";
import "./App.css";

function App(): ReactNode {
  const [items, setItems] = useState<WatchlistDbItem[]>([]);

  useEffect(() => {
    setItems([
      {
        id: 1,
        description: "dummy",
        url: "http://localhost",
        keepMonitoring: true,
        dateUpdated: "2001-02-03",
        lowestPrice: 100,
        currentPrice: 200,
      },
    ]);
  }, []);

  return (
    <>
      <WatchlistView items={items} />
    </>
  );
}

export default App;
