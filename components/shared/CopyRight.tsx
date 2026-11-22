import Link from "next/link";

export default function Copyright() {
  return (
    <p className="text-xs sm:text-sm  ">
      © {new Date().getFullYear()} All rights reserved. Designed by{" "}
      <Link
        href="https://gogrene.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        Gogrene Inc
      </Link>
    </p>
  );
}
