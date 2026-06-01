import { ScanReport } from '../types';

export const DEFAULT_REPORTS: ScanReport[] = [
  {
    id: 'report-1',
    fileName: 'Vitamin_D_Cognitive_Enhancement_v2.pdf',
    paperTitle: 'The Effect of Vitamin D on Cognitive Performance',
    date: '2026-05-29 10:14',
    score: 94.8,
    verifiedCount: 142,
    weakCount: 12,
    hallucinatedCount: 3,
    confidenceIndex: 99.2,
    processingTime: 1.4,
    citations: [
      { id: '#01', title: 'Attention Is All You Need', journal: 'NIPS Proceedings, 2017', status: 'Verified', score: 98 },
      { id: '#09', title: 'Generative Models in High Energy Physics', journal: 'Physical Review Letters, 2023', status: 'Verified', score: 92 },
      { id: '#12', title: 'Deep Learning for Protein Structure Prediction', journal: 'Nature Methods, 2021', status: 'Weak Evidence', score: 45 },
      { id: '#42', title: 'Challenges in Citation Verification Systems', journal: 'ACM Computing Surveys, 2024', status: 'Fabricated Citation', score: 12 }
    ],
    alerts: [
      { id: '1', title: 'Missing DOI for Ref #42', description: 'The source URL returns a 404. Identity could not be verified.', severity: 'high' },
      { id: '2', title: 'Source Contradiction in Section 3.1', description: 'Claimed result "p < 0.05" differs from actual source "p = 0.12".', severity: 'medium' },
      { id: '3', title: 'Fabricated Author Attribution', description: '"Dr. Silas Vance" has no publication record for the cited journal.', severity: 'high' }
    ]
  },
  {
    id: 'report-2',
    fileName: 'Quantum_Computing_Cryptographic_Defense.pdf',
    paperTitle: 'Quantum Key Distribution and Post-Quantum Cryptographical Systems',
    date: '2026-05-28 17:35',
    score: 81.2,
    verifiedCount: 88,
    weakCount: 27,
    hallucinatedCount: 6,
    confidenceIndex: 91.5,
    processingTime: 2.1,
    citations: [
      { id: '#03', title: 'Post-Quantum Cryptography Architectures', journal: 'IEEE Trans on Info Theory, 2020', status: 'Verified', score: 95 },
      { id: '#15', title: 'Shor\'s Algorithm on Noisy Intermediate-Scale Quantum Computers', journal: 'Nature Physics, 2021', status: 'Verified', score: 91 },
      { id: '#22', title: 'Synthetic Lattice-Based Cryptography Signatures', journal: 'Journal of Cryptology, 2022', status: 'Weak Evidence', score: 58 },
      { id: '#37', title: 'Efficient Lattice Reduction Algorithms', journal: 'Theoretical Computer Science, 2025', status: 'Fabricated Citation', score: 8 }
    ],
    alerts: [
      { id: '1', title: 'Retracted Paper Citation in Bibliography', description: 'Ref #22 was retracted by editors in Feb 2024.', severity: 'medium' },
      { id: '2', title: 'Fabricated Lattice Solvers', description: 'Ref #37 "A Polynomial-Time Solution to Lattice Decoding" has no DOI or publisher record.', severity: 'high' }
    ]
  },
  {
    id: 'report-3',
    fileName: 'SARS_CoV_2_Transmission_Dynamics.pdf',
    paperTitle: 'Epidemiological Modeling and Spatiotemporal Transmission Dynamics',
    date: '2026-05-27 11:22',
    score: 100.0,
    verifiedCount: 210,
    weakCount: 0,
    hallucinatedCount: 0,
    confidenceIndex: 99.9,
    processingTime: 3.2,
    citations: [
      { id: '#01', title: 'A Model of SARS-CoV-2 Spread Tendencies', journal: 'The Lancet Infectious Diseases, 2020', status: 'Verified', score: 100 },
      { id: '#02', title: 'Global Pandemic Dynamics and Intervention Effects', journal: 'Science, 2020', status: 'Verified', score: 99 }
    ],
    alerts: []
  }
];
