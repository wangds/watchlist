import {
  Dispatch,
  FormEvent,
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
      <form
        className={styles.editScript}
        onSubmit={(evt) => {
          saveChanges(evt);
        }}
      >
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
        <span className={styles.checkmark}>
          <span>✓</span>
        </span>
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
      textarea.value = util.trimEndMultiline(script);
    })
    .catch((err: unknown) => {
      console.error(err);
    });
}

function saveChanges(evt: FormEvent): void {
  evt.preventDefault();

  const form: HTMLFormElement = evt.target as HTMLFormElement;
  const site = (form.site as HTMLSelectElement).value;
  const checkmark = form.querySelector(`span.${styles.checkmark} > span`);
  if (!checkmark) return;

  const uri = encodeURIComponent(`https://${site}`);
  const script = util.trimEndMultiline(
    form.querySelector("textarea")?.value ?? "",
  );

  checkmark.className = "";

  fetch(`/api/edit-script/${uri}`, {
    method: "POST",
    body: script,
  })
    .then((res) => {
      if (res.status === 200) checkmark.className = styles.success;
    })
    .catch((err: unknown) => {
      console.error(err);
    });
}

export default EditScriptView;
