interface ProfileHeaderProps {
  username: string;
  displayName: string | null;
  avatarUrl: string;
  profileUrl: string;
  totalContributions: number;
  year: number;
}

export default function ProfileHeader({
  username,
  displayName,
  avatarUrl,
  profileUrl,
  totalContributions,
  year
}: ProfileHeaderProps) {
  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col items-center gap-3 text-center outline-none"
      aria-label={`Open @${username}'s GitHub profile`}
    >
      <img
        src={avatarUrl}
        alt={`${username}'s GitHub avatar`}
        className="h-16 w-16 rounded-full border border-gray-200 object-cover transition group-hover:opacity-90 group-focus-visible:ring-2 group-focus-visible:ring-black"
        width={64}
        height={64}
      />
      <div>
        {displayName && (
          <p className="text-base font-semibold tracking-tight text-black">
            {displayName}
          </p>
        )}
        <p className="font-mono text-sm text-gray-500 group-hover:text-black">
          @{username}
        </p>
        <p className="mt-1 text-sm text-gray-700">
          {totalContributions.toLocaleString()} contributions in {year}
        </p>
      </div>
    </a>
  );
}
