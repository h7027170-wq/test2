export default function Loading() {
  return (
    <div className="container-page py-14" aria-busy="true">
      <span className="animate-shimmer block h-10 w-64 rounded-md" />
      <span className="animate-shimmer mt-4 block h-5 w-full max-w-xl rounded-md" />
      <span className="animate-shimmer mt-2 block h-5 w-full max-w-lg rounded-md" />
    </div>
  );
}
