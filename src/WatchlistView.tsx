import { ReactNode } from "react";
import { WatchlistDbItem } from "../database";
import styles from "./WatchlistView.module.css";

interface WatchlistViewProps {
  items: WatchlistDbItem[];
}

function WatchlistView(props: WatchlistViewProps): ReactNode {
  const items = props.items.filter((item) => item.keepMonitoring);
  items.sort((a, b) => {
    return (
      // Group different sources for the same item together
      a.description.localeCompare(b.description) ||
      // Order items within group by increasing price
      (a.currentPrice ?? Number.MAX_SAFE_INTEGER) -
        (b.currentPrice ?? Number.MAX_SAFE_INTEGER) ||
      // Order items within group with same price by source
      a.url.localeCompare(b.url)
    );
  });

  return (
    <table className={styles.watchlist}>
      <thead>
        <tr>
          <th>Item</th>
          <th>⏸</th>
          <th>Last Updated</th>
          <th>Historical Low</th>
          <th>Current Price</th>
          <th>Discount</th>
        </tr>
      </thead>
      <tbody>{items.map((item) => WatchlistViewRow(item))}</tbody>
    </table>
  );
}

function WatchlistViewRow(item: WatchlistDbItem): ReactNode {
  return (
    <tr key={item.id}>
      <td>
        {item.description}
        <span className={styles.linkhost}>
          (<a href={item.url}>{new URL(item.url).hostname}</a>)
        </span>
      </td>
      <td>{item.keepMonitoring ? "⏺" : "⏸"}</td>
      <td>{item.dateUpdated}</td>
      <td>{formatPrice(item.lowestPrice)}</td>
      <td>{formatPrice(item.currentPrice)}</td>
      <td>{formatPrice(item.currentDiscount)}</td>
    </tr>
  );
}

function formatPrice(cents?: number): string {
  return cents && cents > 0 ? `$${(cents / 100).toFixed(2)}` : "-";
}

export default WatchlistView;
