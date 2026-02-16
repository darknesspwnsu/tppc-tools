import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel page-header">
      <h1 className="page-title">404</h1>
      <div className="page-subtitle">That page does not exist.</div>
      <div className="mt-3">
        <Link className="btn btn-primary" href="/">
          Back to tools
        </Link>
      </div>
    </div>
  );
}

