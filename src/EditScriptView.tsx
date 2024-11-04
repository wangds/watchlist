import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { WatchlistDbItem } from "../database";
import styles from "./EditScriptView.module.css";
import util from "../util";

interface EditScriptViewProps {
  items: WatchlistDbItem[];
}

function EditScriptView(props: EditScriptViewProps): ReactNode {
  const [site, setSite] = useState("");

  const uniqueSites = new Set(
    props.items.map((item) => new URL(item.url).hostname),
  );
  const domainNames = Array.from(uniqueSites).sort();

  useEffect(() => {
    if (site === "" && domainNames.length > 0) {
      const select = document.querySelector(
        `form.${styles.editScript} > select`,
      );
      onChangeSite(setSite, select as HTMLSelectElement, domainNames[0]);
    }
  }, [site, domainNames]);

  return (
    <>
      <h3>Script</h3>
      <form className={styles.editScript}>
        <label htmlFor="site">Site:</label>
        <select
          id="site"
          value={site}
          onChange={(evt) => {
            onChangeSite(setSite, evt.target, evt.target.value);
          }}
          required
        >
          <option disabled hidden value="">
            -
          </option>
          {domainNames.map((site) => SiteSelection(site))}
        </select>

        <pre>
          <code>
            {"async function(page, util) {"}
            <textarea cols={80} rows={20} spellCheck={false} />
            {"}"}
          </code>
        </pre>

        <button type="submit">Save changes</button>
      </form>
    </>
  );
}

function SiteSelection(site: string): ReactNode {
  return <option key={site}>{site}</option>;
}

function onChangeSite(
  setSite: Dispatch<SetStateAction<string>>,
  el: HTMLSelectElement,
  site: string,
): void {
  const form = util.findAncestor(el, "form");
  const textarea = form?.querySelector("textarea");
  if (!textarea) return;

  const uri = encodeURIComponent(`https://${site}`);

  fetch(`/api/script/${uri}`)
    .then(async (res) => {
      const script = await res.text();
      setSite(site);
      textarea.value = script;
    })
    .catch((err: unknown) => {
      console.error(err);
    });
}

export default EditScriptView;
