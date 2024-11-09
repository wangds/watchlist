import { ReactNode } from "react";
import styles from "./NavbarView.module.css";

interface NavbarViewProps {
  currentPage: string;
}

export const IndexPage = "/";
export const EditScriptPage = "/edit-script.html";

function NavbarView({ currentPage }: NavbarViewProps): ReactNode {
  let count = 0;

  function cls(href: string): string | undefined {
    return currentPage === href && count++ === 0 ? styles.current : undefined;
  }

  return (
    <div className={styles.navbar}>
      <a className={cls(EditScriptPage)} href={EditScriptPage}>
        Edit Scripts
      </a>
      <a className={cls(currentPage)} href={IndexPage}>
        Watchlist
      </a>
    </div>
  );
}

export default NavbarView;
