import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { WatchlistDbItem } from "../database";
import util from "../util";
import styles from "./WatchlistView.module.css";

interface WatchlistViewProps {
  items: WatchlistDbItem[];
  setItems: Dispatch<SetStateAction<WatchlistDbItem[]>>;
}

const enum MonitorFilter {
  All = 0,
  Monitored,
  Unmonitored,
}

function WatchlistView(props: WatchlistViewProps): ReactNode {
  const [itemFilter, setItemFilter] = useState("");
  const [monitorFilter, setMonitorFilter] = useState(MonitorFilter.Monitored);
  const [dateFilter, setDateFilter] = useState(false);
  const [discountFilter, setDiscountFilter] = useState(false);

  const mostRecent = dateFilter ? findMostRecentDateUpdated(props) : "";
  const items = props.items.filter((item) => {
    if (monitorFilter) {
      if (monitorFilter === MonitorFilter.Monitored && !item.keepMonitoring)
        return false;
      if (monitorFilter === MonitorFilter.Unmonitored && item.keepMonitoring)
        return false;
    }

    if (dateFilter && item.dateUpdated !== mostRecent) {
      return false;
    }

    if (discountFilter && (item.currentDiscount ?? 0) <= 0) {
      return false;
    }

    if (itemFilter.trim()) {
      const str = itemFilter.toLocaleLowerCase();
      if (
        !item.description.toLocaleLowerCase().includes(str) &&
        !item.url.toLocaleLowerCase().includes(str)
      )
        return false;
    }
    return true;
  });
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
          <th className={styles.item}>Item</th>
          <th>👀</th>
          <th
            className="clickable"
            onClick={(evt) => {
              updateItems(evt.target as HTMLElement, props);
            }}
          >
            Updated
          </th>
          <th className={styles.borderBottom} rowSpan={2}>
            Historical Low
          </th>
          <th className={styles.borderBottom} rowSpan={2}>
            Current Price
          </th>
          <th>Discount</th>
        </tr>
        <tr>
          <th className={[styles.item, styles.borderBottom].join(" ")}>
            <input
              id="itemFilter"
              type="text"
              value={itemFilter}
              onChange={(evt) => {
                setItemFilter(evt.target.value);
              }}
              placeholder="containing…"
            />
          </th>
          <th className={styles.borderBottom}>
            <select
              id="monitorFilter"
              value={monitorFilter}
              onChange={(evt) => {
                setMonitorFilter(Number(evt.target.value));
              }}
            >
              <option value={MonitorFilter.All}>*</option>
              <option value={MonitorFilter.Monitored}>✓</option>
              <option value={MonitorFilter.Unmonitored}>✗</option>
            </select>
          </th>
          <th className={styles.borderBottom}>
            <input
              id="dateFilter"
              type="checkbox"
              checked={dateFilter}
              onChange={(evt) => {
                setDateFilter(evt.target.checked);
              }}
            />
          </th>
          <th className={styles.borderBottom}>
            <input
              id="discountFilter"
              type="checkbox"
              checked={discountFilter}
              onChange={(evt) => {
                setDiscountFilter(evt.target.checked);
              }}
            />
          </th>
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
      <td>
        <input
          name="keepMonitoring"
          type="checkbox"
          className="clickable"
          defaultChecked={item.keepMonitoring}
          onChange={(evt) => {
            toggleMonitorItem(evt.target as HTMLElement, props);
          }}
        />
      </td>
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

function findMostRecentDateUpdated(props: WatchlistViewProps): string {
  return props.items
    .map((item) => item.dateUpdated ?? "")
    .reduce((a, b) => (a >= b ? a : b), "");
}

function formatPrice(cents?: number): string {
  return cents && cents > 0 ? `$${(cents / 100).toFixed(2)}` : "-";
}

function toggleMonitorItem(el: HTMLElement, props: WatchlistViewProps): void {
  const tr = util.findAncestor(el, "tr");
  const itemId = tr?.dataset.itemId;
  const item = props.items.find((item) => item.id === Number(itemId));
  if (!itemId || !item) return;

  fetch(`/api/edit-item/${itemId}`, {
    method: "POST",
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      keepMonitoring: !item.keepMonitoring,
    }),
  })
    .then(async (res) => {
      await replaceItem(res, props);
    })
    .catch((err: unknown) => {
      console.error(err);
    });
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
      await replaceItem(res, props);
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

async function replaceItem(res: Response, props: WatchlistViewProps) {
  const replacement = (await res.json()) as WatchlistDbItem;

  // Queue an updater function instead of replacing the state to avoid
  // concurrent updates clobberring each other's updates.
  props.setItems((items) =>
    items.map((item) => (item.id === replacement.id ? replacement : item)),
  );
}

export default WatchlistView;
