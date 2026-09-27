import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center items-center">
      <Link
        className=" px-4 py-2 bg-blue-500 text-white rounded-md"
        href="/dashboard"
      >
        اضغط علي
      </Link>
    </div>
  );
}
