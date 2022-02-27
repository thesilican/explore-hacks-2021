import { Sheets } from "../sheets";

// Typedef for a mentor
type Mentor = {
  userID: string;
  doNotDisturb: string;
  client: string | null;
};

// Reads all the mentors from the database
// Also checks each mentor to see if their do not disturb has expired
// If so, sets their do not disturb to "off"
export async function getMentors(sheets: Sheets): Promise<Mentor[]> {
  const data = await sheets.readSheet("Mentors");
  const mentors = data.map((row) => ({
    userID: row[0],
    doNotDisturb: row[1],
    client: row[2] === "null" ? null : row[2],
  }));
  const now = new Date();
  for (let i = 0; i < mentors.length; i++) {
    const mentor = mentors[i];
    if (mentor.doNotDisturb === "always" || mentor.doNotDisturb === "off") {
      continue;
    }
    const date = new Date(mentor.doNotDisturb);
    const expired = now.getTime() > date.getTime();
    if (expired) {
      await sheets.updateCell("Mentors", i, 1, "off");
      mentor.doNotDisturb = "off";
    }
  }
  return mentors;
}
