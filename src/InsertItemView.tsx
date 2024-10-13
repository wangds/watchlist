import { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { WatchlistDbItem } from "../database";
import styles from "./InsertItemView.module.css";

interface InsertItemViewProps {
  items: WatchlistDbItem[];
  setItems: Dispatch<SetStateAction<WatchlistDbItem[]>>;
}

function InsertItemView(props: InsertItemViewProps): ReactNode {
  return (
    <form
      className={styles.insertItem}
      onSubmit={(evt) => {
        insertItem(evt, props);
      }}
    >
      <span>
        <label htmlFor="description">Description:</label>
        <input
          id="description"
          type="text"
          placeholder="item description"
          required
        />
      </span>

      <span>
        <label htmlFor="url">Url:</label>
        <input
          id="url"
          type="text"
          placeholder="https://"
          pattern="https?://.+"
          required
        />
      </span>

      <button type="submit">Add item</button>
    </form>
  );
}

function insertItem(evt: FormEvent, props: InsertItemViewProps): void {
  evt.preventDefault();

  const form: HTMLFormElement = evt.target as HTMLFormElement;
  const description = (form.description as HTMLInputElement).value.trim();
  const url = (form.url as HTMLInputElement).value.trim();

  // Client-side data validation before submitting.
  if (description.length <= 0 || !URL.canParse(url)) return;

  if (props.items.some((item) => item.url === url)) {
    form.reset();
    return;
  }

  fetch("/api/item", {
    method: "PUT",
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      description: description,
      url: url,
    }),
  })
    .then(async (res) => {
      const insertedItem = (await res.json()) as WatchlistDbItem;
      props.setItems((items) => [...items, insertedItem]);
      form.reset();
    })
    .catch((err: unknown) => {
      console.error(err);
    });
}

export default InsertItemView;
