import { ReactNode } from "react";
import styles from "./HintView.module.css";

function HintView(): ReactNode {
  return (
    <>
      <h3>Hints</h3>
      <ol>
        <li>
          Find the main container:
          {eg(
            "const div = await page.waitForSelector(selector, { visible: true });",
          )}
          Verify the content by saving a screenshot:
          {eg('await div.screenshot({ path: ",filename.png" });')}
        </li>
        <li>
          Select an element (promise) within the container:
          {eg("const el = div.$(selector);")}
        </li>
        <li>
          Select text or attribute from the element promise:
          {eg(
            "const text = await util.selectAttribute(el, attr, [TextTransform]);",
            "const text = await util.selectTextContent(el, [TextTransform]);",
          )}
          where <code>TextTransform</code> is a <code>string→string</code>{" "}
          function:
          {eg("text => text.replace(/search/, replacement)")}
          Verify the content by logging the string:
          {eg("console.log(`${page.url()}: ${text}`);")}
        </li>
        <li>
          Extract price data from the text:
          {eg("const price = util.parsePrice(text);")}
        </li>
      </ol>
    </>
  );
}

function eg(ln1: string, ln2?: string): ReactNode {
  return (
    <code className={styles.example}>
      {ln1}
      {ln2 ? <br /> : null}
      {ln2}
    </code>
  );
}

export default HintView;
