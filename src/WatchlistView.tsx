import { Dispatch, ReactNode, SetStateAction } from "react";
import { WatchlistDbItem } from "../database";
import util from "../util";
import styles from "./WatchlistView.module.css";

interface WatchlistViewProps {
  items: WatchlistDbItem[];
  setItems: Dispatch<SetStateAction<WatchlistDbItem[]>>;
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
          <th
            className="clickable"
            onClick={(evt) => {
              updateItems(evt.target as HTMLElement, props);
            }}
          >
            Last Updated
          </th>
          <th>Historical Low</th>
          <th>Current Price</th>
          <th>Discount</th>
        </tr>
      </thead>
      <tbody>{items.map((item) => WatchlistViewRow(props, item))}</tbody>
    </table>
  );
}

function WatchlistViewRow(
  props: WatchlistViewProps,
  item: WatchlistDbItem,
): ReactNode {
  return (
    <tr key={item.id} data-item-id={item.id}>
      <td>
        {item.description}
        <span className={styles.linkhost}>
          (<a href={item.url}>{new URL(item.url).hostname}</a>)
        </span>
      </td>
      <td>{item.keepMonitoring ? "⏺" : "⏸"}</td>
      <td>
        <span
          className="clickable"
          onClick={(evt) => {
            updateItem(evt.target as HTMLElement, props);
          }}
        >
          {item.dateUpdated ?? "-"}
        </span>
      </td>
      <td>{formatPrice(item.lowestPrice)}</td>
      <td>{formatPrice(item.currentPrice)}</td>
      <td>{formatPrice(item.currentDiscount)}</td>
    </tr>
  );
}

function formatPrice(cents?: number): string {
  return cents && cents > 0 ? `$${(cents / 100).toFixed(2)}` : "-";
}

function updateItem(el: HTMLElement | null, props: WatchlistViewProps): void {
  const td = util.findAncestor(el, "td");
  const tr = util.findAncestor(td, "tr");
  const itemId = tr?.dataset.itemId;
  if (!itemId || !td || td.className === styles.updating) return;

  // Change class to indicate update in progress.
  td.className = styles.updating;

  fetch(`/api/update-item/${itemId}`, {
    method: "POST",
  })
    .then(async (res) => {
      const replacement = (await res.json()) as WatchlistDbItem;

      // Queue an updater function instead of replacing the state to avoid
      // concurrent updates clobberring each other's updates.
      props.setItems((items) =>
        items.map((item) => (item.id === replacement.id ? replacement : item)),
      );
    })
    .catch((err: unknown) => {
      console.error(err);
    })
    .finally(() => {
      td.className = "";
    });
}

function updateItems(el: HTMLElement, props: WatchlistViewProps): void {
  const table = util.findAncestor(el, "table");
  if (!table) return;

  // Update visible items that are not recent and not currently updating
  const today = util.formatDate(new Date());
  table.querySelectorAll(`tbody > tr`).forEach((tr) => {
    const itemId = Number((tr as HTMLElement).dataset.itemId);
    const item = props.items.find((item) => item.id === itemId);
    if (item && item.keepMonitoring && item.dateUpdated !== today) {
      updateItem(tr.querySelector("span.clickable"), props);
    }
  });
}

export default WatchlistView;
