export interface Candidate {
  id: string;
  name: string;
  position: string;
  manifesto: string;
  imageUrl: string;
  voteCount: number;
}

export interface Voter {
  id: string;
  name: string;
  registrationNumber: string;
  hasVoted: boolean;
}

export interface Election {
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface Vacancy {
  id: string;
  title: string;
  description: string;
  requirements: string[];
}