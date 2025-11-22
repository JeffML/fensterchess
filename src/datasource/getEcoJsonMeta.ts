import { Octokit } from "octokit";

interface GitHubFileMetadata {
  name: string;
  download_url: string;
  // Add other properties as needed
}

// not used, but kept in case github d/l urls ever change in the far future
async function getDownloadUrls(): Promise<GitHubFileMetadata[]> {
  const octokit = new Octokit(); // No auth

  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/",
    {
      owner: "hayatbiralem",
      repo: "eco.json",
    }
  );

  // const downloads = data.map((meta) => {
  //     if (filesOfInterest.includes(meta.name)) return meta.download_url;
  // });

  // console.log(JSON.stringify(downloads, null, 2))
  return data as GitHubFileMetadata[];
}

const meta = await getDownloadUrls();

console.log(JSON.stringify(meta, null, 2));
