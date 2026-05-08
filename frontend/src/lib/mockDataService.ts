/**
 * Mock Data Service for justBeforExam Frontend
 * Provides realistic mock data for development while backend APIs are being finalized
 * Easily swappable with real API calls later
 */

export interface MockNote {
    id: string;
    content: string;
    title: string;
}

export interface MockTopic {
    id: string;
    name: string;
    description: string;
    questionsCount: number;
}

export interface MockQuiz {
    id: string;
    title: string;
    questions: MockQuestion[];
    createdAt: string;
}

export interface MockQuestion {
    id: string;
    question: string;
    type: "mcq" | "short_answer";
    options?: string[];
    correctAnswer: string;
    explanation: string;
    topic: string;
}

export interface MockQuizResult {
    quizId: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    results: MockQuestionResult[];
    weakAreas: string[];
    strongAreas: string[];
    timestamp: string;
}

export interface MockQuestionResult {
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
    topic: string;
}

export interface MockRecommendation {
    id: string;
    title: string;
    url: string;
    type: "article" | "video" | "interactive";
    relevanceScore: number;
    topic: string;
    description: string;
}

// ============================================================================
// MOCK NOTES
// ============================================================================

const MOCK_NOTES = `# Cryptography & Security - Complete Study Notes

## Table of Contents
1. Introduction to Cryptography
2. Classical Cryptography
3. Modern Cryptography
4. Public Key Infrastructure
5. Digital Signatures
6. Hash Functions
7. Applications & Best Practices

---

## 1. Introduction to Cryptography

### Definition
Cryptography is the practice of securing communication and information from unauthorized access through mathematical and algorithmic methods. The word comes from Greek: "crypto" (hidden) and "graphy" (writing).

### Core Objectives (CIA Triad)
- **Confidentiality**: Ensuring only authorized parties can access information
- **Integrity**: Ensuring information hasn't been altered or tampered with
- **Authenticity**: Verifying the origin and identity of information
- **Non-repudiation**: Preventing denial of sending/receiving messages

### Key Concepts
- **Plaintext**: Original message before encryption
- **Ciphertext**: Encrypted message
- **Key**: Secret value used in encryption/decryption
- **Algorithm**: Mathematical procedure for encryption
- **Cryptanalysis**: Science of breaking encryption

---

## 2. Classical Cryptography

### Caesar Cipher
**Definition**: Substitution cipher where each letter is shifted by a fixed number (3 in original Caesar cipher).

**Example**:
\`\`\`
Plaintext:  HELLO
Shift:      3
Ciphertext: KHOOR
\`\`\`

**Weakness**: Very vulnerable to frequency analysis. With only 26 possible shifts, easily broken.

### Substitution Cipher
Replaces each plaintext character with another according to a fixed mapping.

**Strengths**:
- More secure than Caesar cipher
- 26! possible keys

**Weaknesses**:
- Vulnerable to frequency analysis
- Language patterns still visible
- Vulnerable to dictionary attacks

### Vigenère Cipher
Uses a keyword to generate a polyalphabetic substitution cipher.

**Formula**: \`C = (P + K) mod 26\`

**Strengths**:
- Resists simple frequency analysis
- Used historically in many applications

**Weaknesses**:
- Vulnerable to Kasiski examination
- Pattern detection possible with long text

---

## 3. Modern Cryptography

### Symmetric Encryption (Secret Key Cryptography)
Uses the **same key** for both encryption and decryption.

#### AES (Advanced Encryption Standard)
- **Block size**: 128 bits
- **Key sizes**: 128, 192, 256 bits
- **Rounds**: 10, 12, 14 (depending on key size)
- **Security**: Currently considered secure
- **Status**: US Federal Standard (FIPS 197)

**Process**:
1. SubBytes - Substitution using S-box
2. ShiftRows - Permutation of bytes
3. MixColumns - Multiplication in Galois field
4. AddRoundKey - XOR with round key

#### DES (Data Encryption Standard)
- **Block size**: 64 bits
- **Key size**: 56 bits (8 parity bits)
- **Rounds**: 16
- **Status**: DEPRECATED (weak key size)

### Asymmetric Encryption (Public Key Cryptography)
Uses **different keys** - public key for encryption, private key for decryption.

#### RSA (Rivest-Shamir-Adleman)
**Based on**: Difficulty of factoring large numbers

**Key Generation**:
1. Choose two large prime numbers p and q
2. Compute n = p × q
3. Compute φ(n) = (p-1)(q-1)
4. Choose e where 1 < e < φ(n) and gcd(e, φ(n)) = 1
5. Compute d where e × d ≡ 1 (mod φ(n))
6. Public key: (e, n), Private key: (d, n)

**Encryption**: C = M^e mod n
**Decryption**: M = C^d mod n

**Key Sizes**:
- Minimum recommended: 2048 bits
- Secure for long-term: 4096 bits

**Advantages**:
- Solves key distribution problem
- Enables digital signatures
- Public key infrastructure possible

**Disadvantages**:
- Slower than symmetric encryption
- Larger key sizes
- Computationally expensive

---

## 4. Public Key Infrastructure (PKI)

### Digital Certificates
Bind identity to a public key.

**Components**:
- Subject name
- Subject public key
- Issuer name
- Serial number
- Validity period
- Digital signature of issuer

### Certificate Authority (CA)
Trusted organization that verifies identities and issues certificates.

### Certificate Chain (Chain of Trust)
- Root CA → Intermediate CA → End-entity certificate
- Each certificate signed by the one above it

---

## 5. Digital Signatures

### Purpose
Proves authenticity and non-repudiation of a message.

### Process
1. **Signing**: Hash message → Encrypt hash with private key
2. **Verification**: Decrypt hash with public key → Compare with fresh hash

### Algorithms
- RSA-based signatures
- DSA (Digital Signature Algorithm)
- ECDSA (Elliptic Curve DSA)
- EdDSA (Edwards Curve DSA)

---

## 6. Hash Functions

### Properties
1. **Deterministic**: Same input always produces same output
2. **Quick computation**: Fast to compute hash value
3. **Avalanche effect**: Small input change → Completely different output
4. **One-way**: Cannot reverse hash to get original input
5. **Collision-resistant**: Cannot find two inputs with same hash

### Common Hash Functions

#### MD5 (128-bit)
- **Status**: DEPRECATED
- **Vulnerabilities**: Collision attacks found
- **Use**: Only for non-cryptographic purposes

#### SHA-1 (160-bit)
- **Status**: DEPRECATED for new applications
- **Security**: Collision attacks possible
- **Note**: Removed from Chrome, browsers

#### SHA-2 Family
- SHA-256: 256-bit output
- SHA-512: 512-bit output
- **Status**: SECURE (currently recommended)
- **Uses**: TLS, Bitcoin, GPG

#### SHA-3 (Keccak)
- **Bit lengths**: 224, 256, 384, 512
- **Status**: SECURE
- **Design**: Sponge construction
- **Benefits**: Better security margin than SHA-2

### Hash Function Applications
- **Password storage**: Salted hash storage
- **Message integrity**: Verify data hasn't changed
- **Blockchain**: Proof of work, transaction verification
- **Digital signatures**: Sign hash instead of entire message

---

## 7. Applications & Best Practices

### HTTPS/TLS (Transport Layer Security)
Combines symmetric and asymmetric cryptography:
1. **Handshake**: Asymmetric encryption to establish session key
2. **Data transfer**: Symmetric encryption with session key

### Password Security Best Practices
1. ✓ Use salted hashing (bcrypt, scrypt, PBKDF2)
2. ✓ Use strong password policies
3. ✓ Implement rate limiting on login attempts
4. ✓ Consider multi-factor authentication (MFA)
5. ✗ Never store plaintext passwords
6. ✗ Don't use unsalted hashes or fast hashes for passwords

### Secure Key Management
1. Generate keys using cryptographically secure random
2. Store keys securely (hardware security modules, vaults)
3. Rotate keys periodically
4. Never hardcode keys in source code
5. Use environment variables or secure vaults

### Common Security Mistakes
- Using weak algorithms (MD5, SHA-1)
- Reusing encryption keys across applications
- Weak random number generation
- Not validating digital signatures
- Using unsalted or fast hashes for passwords
- Hardcoding secrets in code

---

## Summary Table

| Aspect | Symmetric | Asymmetric |
|--------|-----------|------------|
| Speed | Fast | Slow |
| Key Size | Smaller | Larger |
| Key Sharing | Difficult | Easy (public key) |
| Use | Data encryption | Key exchange, signatures |
| Example | AES | RSA |

---

## Important Formulas & Theorems

### Modular Arithmetic
- Addition: (a + b) mod n
- Multiplication: (a × b) mod n
- Inverse: a × a^(-1) ≡ 1 (mod n)

### Fermat's Little Theorem
If p is prime and gcd(a,p) = 1, then: a^(p-1) ≡ 1 (mod p)

### Euler's Theorem
If gcd(a,n) = 1, then: a^φ(n) ≡ 1 (mod n)

---

## Study Tips & Mnemonics

### Remember the CIA Triad
- **C**onfidentiality - Keep it secret
- **I**ntegrity - Keep it intact
- **A**uthenticity - Prove its origin

### RSA Key Generation Checklist
1. Pick primes (p, q)
2. Multiply: n = p × q
3. Calculate: φ(n) = (p-1)(q-1)
4. Choose: e (public exponent)
5. Compute: d (private exponent)

### Hash Function Selection Guide
- ✓ SHA-256 or SHA-3 for cryptographic use
- ✓ bcrypt/scrypt for password hashing
- ✗ MD5 or SHA-1 for security
- ✗ Regular hashing for passwords

---

## Practice Questions

1. Explain the difference between Caesar cipher and Vigenère cipher.
2. Why is RSA secure? What assumption does it rely on?
3. What is the difference between encryption and hashing?
4. Describe the process of digital signature creation and verification.
5. Why are salted hashes better for password storage than unsalted hashes?
6. What is the purpose of a Certificate Authority in PKI?
7. Explain the TLS handshake process.
8. What are the security advantages of SHA-256 over SHA-1?

---

**Note**: This material covers fundamental cryptography concepts. Security is evolving constantly. Always stay updated with latest recommendations and use established, well-vetted libraries rather than implementing crypto algorithms yourself.
`;

const MOCK_TOPICS: MockTopic[] = [
    {
        id: "intro",
        name: "Introduction to Cryptography",
        description:
            "Fundamentals including CIA triad, plaintext, ciphertext, and basic concepts",
        questionsCount: 3,
    },
    {
        id: "classical",
        name: "Classical Cryptography",
        description:
            "Caesar cipher, substitution cipher, Vigenère cipher and their vulnerabilities",
        questionsCount: 4,
    },
    {
        id: "symmetric",
        name: "Symmetric Encryption",
        description: "AES, DES, and secret key cryptography",
        questionsCount: 5,
    },
    {
        id: "asymmetric",
        name: "Asymmetric Encryption",
        description:
            "Public key cryptography, RSA algorithm, key generation and usage",
        questionsCount: 4,
    },
    {
        id: "pki",
        name: "Public Key Infrastructure",
        description: "Certificates, Certificate Authorities, and chain of trust",
        questionsCount: 3,
    },
    {
        id: "signatures",
        name: "Digital Signatures",
        description: "Digital signature algorithms, signing and verification process",
        questionsCount: 3,
    },
    {
        id: "hashing",
        name: "Hash Functions",
        description:
            "SHA-256, SHA-3, MD5, hash properties, and applications",
        questionsCount: 4,
    },
    {
        id: "applications",
        name: "Applications & Best Practices",
        description: "HTTPS/TLS, password security, key management",
        questionsCount: 4,
    },
];

// ============================================================================
// MOCK QUIZ
// ============================================================================

const MOCK_QUIZ: MockQuiz = {
    id: "quiz-001",
    title: "Cryptography Fundamentals Quiz",
    questions: [
        {
            id: "q1",
            question:
                "What are the three components of the CIA Triad in cryptography?",
            type: "mcq",
            options: [
                "Confidentiality, Integrity, Availability",
                "Confidentiality, Integrity, Authenticity",
                "Confidentiality, Identity, Authenticity",
                "Certification, Integrity, Authenticity",
            ],
            correctAnswer: "Confidentiality, Integrity, Authenticity",
            explanation:
                "The CIA Triad consists of Confidentiality (keeping information secret), Integrity (ensuring information hasn't been altered), and Authenticity (verifying the origin of information). 'Availability' is sometimes included as a fourth component.",
            topic: "intro",
        },
        {
            id: "q2",
            question: "Which of the following is NOT a weakness of the Caesar Cipher?",
            type: "mcq",
            options: [
                "It only has 26 possible keys",
                "It is vulnerable to frequency analysis",
                "It requires exchange of a large key",
                "It preserves letter frequency patterns",
            ],
            correctAnswer:
                "It requires exchange of a large key",
            explanation:
                "The Caesar Cipher uses a small fixed shift value (typically 3), so it doesn't require exchanging a large key. The other options are actual weaknesses of this simple substitution cipher.",
            topic: "classical",
        },
        {
            id: "q3",
            question: "What is the block size of AES encryption?",
            type: "mcq",
            options: ["64 bits", "128 bits", "256 bits", "512 bits"],
            correctAnswer: "128 bits",
            explanation:
                "AES (Advanced Encryption Standard) uses a fixed block size of 128 bits. The variable part is the key size, which can be 128, 192, or 256 bits.",
            topic: "symmetric",
        },
        {
            id: "q4",
            question:
                "In RSA cryptography, what is the mathematical problem that makes it secure?",
            type: "mcq",
            options: [
                "Computing large prime numbers",
                "Factoring large numbers into prime factors",
                "Finding the inverse modulo",
                "Computing discrete logarithms",
            ],
            correctAnswer: "Factoring large numbers into prime factors",
            explanation:
                "RSA's security is based on the difficulty of factoring large composite numbers (n = p × q) into their prime factors. While factoring is easy for small numbers, it becomes computationally infeasible for very large numbers with current technology.",
            topic: "asymmetric",
        },
        {
            id: "q5",
            question:
                "What is the minimum recommended key size for RSA in modern systems?",
            type: "mcq",
            options: [
                "512 bits",
                "1024 bits",
                "2048 bits",
                "4096 bits",
            ],
            correctAnswer: "2048 bits",
            explanation:
                "The minimum recommended key size for RSA is 2048 bits for general security. For long-term security and highly sensitive data, 4096 bits is recommended.",
            topic: "asymmetric",
        },
        {
            id: "q6",
            question:
                "Which hash function is considered deprecated and should not be used for cryptographic purposes?",
            type: "mcq",
            options: ["SHA-256", "SHA-3", "MD5", "SHA-512"],
            correctAnswer: "MD5",
            explanation:
                "MD5 is deprecated because collision attacks (finding two different inputs with the same hash) have been successfully demonstrated. SHA-256, SHA-3, and SHA-512 are secure alternatives.",
            topic: "hashing",
        },
        {
            id: "q7",
            question:
                "What is the primary purpose of using salt in password hashing?",
            type: "mcq",
            options: [
                "To make hashing faster",
                "To make hash output more random and prevent rainbow table attacks",
                "To increase the key size",
                "To enable encryption of passwords",
            ],
            correctAnswer:
                "To make hash output more random and prevent rainbow table attacks",
            explanation:
                "Salting adds a random value to passwords before hashing. This prevents attackers from using pre-computed hash tables (rainbow tables) since the same password will produce different hashes with different salts.",
            topic: "hashing",
        },
        {
            id: "q8",
            question:
                "In a digital signature, what does the signer use to create the signature?",
            type: "mcq",
            options: [
                "The recipient's public key",
                "The recipient's private key",
                "The signer's private key",
                "The signer's public key",
            ],
            correctAnswer: "The signer's private key",
            explanation:
                "The signer uses their own private key to create a digital signature. The recipient then uses the signer's public key to verify the signature. This proves both authenticity and non-repudiation.",
            topic: "signatures",
        },
        {
            id: "q9",
            question:
                "What type of cryptography is typically used in the TLS handshake phase?",
            type: "mcq",
            options: [
                "Only symmetric encryption",
                "Only asymmetric encryption",
                "Asymmetric encryption first, then symmetric encryption",
                "Hash functions only",
            ],
            correctAnswer: "Asymmetric encryption first, then symmetric encryption",
            explanation:
                "TLS uses asymmetric encryption during the handshake to securely exchange a session key. After the handshake, symmetric encryption is used for faster data transfer with the negotiated session key.",
            topic: "applications",
        },
        {
            id: "q10",
            question:
                "Which of the following should NEVER be used for cryptographic hashing?",
            type: "mcq",
            options: [
                "SHA-256",
                "Simple concatenation or custom hash",
                "bcrypt for passwords",
                "SHA-3",
            ],
            correctAnswer: "Simple concatenation or custom hash",
            explanation:
                "Never implement your own cryptographic functions. Use well-tested, standard libraries. Simple concatenation and custom hashes are vulnerable to collisions and attacks. Always use established algorithms like SHA-256, SHA-3, or bcrypt.",
            topic: "applications",
        },
    ],
    createdAt: new Date().toISOString(),
};

// ============================================================================
// MOCK QUIZ RESULT
// ============================================================================

const MOCK_QUIZ_RESULT: MockQuizResult = {
    quizId: "quiz-001",
    score: 8,
    totalQuestions: 10,
    percentage: 80,
    results: [
        {
            questionId: "q1",
            question:
                "What are the three components of the CIA Triad in cryptography?",
            userAnswer: "Confidentiality, Integrity, Authenticity",
            correctAnswer: "Confidentiality, Integrity, Authenticity",
            isCorrect: true,
            explanation:
                "Correct! The CIA Triad is the foundation of information security.",
            topic: "intro",
        },
        {
            questionId: "q2",
            question: "Which of the following is NOT a weakness of the Caesar Cipher?",
            userAnswer: "It is vulnerable to frequency analysis",
            correctAnswer: "It requires exchange of a large key",
            isCorrect: false,
            explanation:
                "Incorrect. Frequency analysis IS a weakness of Caesar Cipher. The correct answer is that it does NOT require a large key - it only requires a small shift value.",
            topic: "classical",
        },
        {
            questionId: "q3",
            question: "What is the block size of AES encryption?",
            userAnswer: "128 bits",
            correctAnswer: "128 bits",
            isCorrect: true,
            explanation: "Correct! AES always uses 128-bit blocks.",
            topic: "symmetric",
        },
        {
            questionId: "q4",
            question:
                "In RSA cryptography, what is the mathematical problem that makes it secure?",
            userAnswer: "Factoring large numbers into prime factors",
            correctAnswer: "Factoring large numbers into prime factors",
            isCorrect: true,
            explanation:
                "Correct! The security of RSA relies on the computational difficulty of factoring large numbers.",
            topic: "asymmetric",
        },
        {
            questionId: "q5",
            question:
                "What is the minimum recommended key size for RSA in modern systems?",
            userAnswer: "1024 bits",
            correctAnswer: "2048 bits",
            isCorrect: false,
            explanation:
                "1024-bit RSA is considered insecure. The recommended minimum is 2048 bits for current security standards.",
            topic: "asymmetric",
        },
        {
            questionId: "q6",
            question:
                "Which hash function is considered deprecated and should not be used for cryptographic purposes?",
            userAnswer: "MD5",
            correctAnswer: "MD5",
            isCorrect: true,
            explanation: "Correct! MD5 has known collision vulnerabilities.",
            topic: "hashing",
        },
        {
            questionId: "q7",
            question:
                "What is the primary purpose of using salt in password hashing?",
            userAnswer:
                "To make hash output more random and prevent rainbow table attacks",
            correctAnswer:
                "To make hash output more random and prevent rainbow table attacks",
            isCorrect: true,
            explanation:
                "Correct! Salting prevents rainbow table attacks and ensures identical passwords hash differently.",
            topic: "hashing",
        },
        {
            questionId: "q8",
            question:
                "In a digital signature, what does the signer use to create the signature?",
            userAnswer: "The signer's private key",
            correctAnswer: "The signer's private key",
            isCorrect: true,
            explanation: "Correct! Only the private key can create valid signatures.",
            topic: "signatures",
        },
        {
            questionId: "q9",
            question:
                "What type of cryptography is typically used in the TLS handshake phase?",
            userAnswer: "Only symmetric encryption",
            correctAnswer: "Asymmetric encryption first, then symmetric encryption",
            isCorrect: false,
            explanation:
                "TLS uses asymmetric encryption during handshake, then switches to symmetric encryption for data transfer.",
            topic: "applications",
        },
        {
            questionId: "q10",
            question:
                "Which of the following should NEVER be used for cryptographic hashing?",
            userAnswer: "SHA-256",
            correctAnswer: "Simple concatenation or custom hash",
            isCorrect: false,
            explanation:
                "SHA-256 is secure. Custom hash functions should never be used - stick to standard algorithms.",
            topic: "applications",
        },
    ],
    weakAreas: ["classical", "applications"],
    strongAreas: ["intro", "symmetric", "asymmetric", "hashing", "signatures"],
    timestamp: new Date().toISOString(),
};

// ============================================================================
// MOCK RECOMMENDATIONS
// ============================================================================

const MOCK_RECOMMENDATIONS: MockRecommendation[] = [
    {
        id: "rec1",
        title: "Classical Ciphers - Deep Dive",
        url: "https://www.youtube.com/watch?v=1234567890ab",
        type: "video",
        relevanceScore: 0.95,
        topic: "classical",
        description:
            "Comprehensive video lecture covering Caesar cipher vulnerabilities and frequency analysis techniques",
    },
    {
        id: "rec2",
        title: "TLS/SSL Protocol Explained",
        url: "https://example.com/tls-tutorial",
        type: "article",
        relevanceScore: 0.92,
        topic: "applications",
        description:
            "Step-by-step guide to understanding the TLS handshake and how it implements cryptographic security",
    },
    {
        id: "rec3",
        title: "RSA Cryptography Interactive Tool",
        url: "https://example.com/rsa-visualizer",
        type: "interactive",
        relevanceScore: 0.88,
        topic: "asymmetric",
        description:
            "Interactive tool to visualize RSA encryption, decryption, and key generation process",
    },
    {
        id: "rec4",
        title: "Hash Function Security Properties",
        url: "https://example.com/hash-functions",
        type: "article",
        relevanceScore: 0.85,
        topic: "hashing",
        description:
            "Detailed article on hash function properties and why certain functions are deprecated",
    },
    {
        id: "rec5",
        title: "Cryptography Best Practices",
        url: "https://example.com/best-practices",
        type: "article",
        relevanceScore: 0.82,
        topic: "applications",
        description:
            "Industry recommendations for implementing cryptography securely in production systems",
    },
];

// ============================================================================
// MOCK DATA SERVICE
// ============================================================================

export const mockDataService = {
    /**
     * Generate mock notes
     */
    generateNotes: async (): Promise<{
        markdown: string;
        topics: MockTopic[];
    }> => {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        return {
            markdown: MOCK_NOTES,
            topics: MOCK_TOPICS,
        };
    },

    /**
     * Get mock topics
     */
    getTopics: async (): Promise<MockTopic[]> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return MOCK_TOPICS;
    },

    /**
     * Generate mock quiz from topics
     */
    generateQuiz: async (topic?: string): Promise<MockQuiz> => {
        await new Promise((resolve) => setTimeout(resolve, 1200));

        if (topic) {
            // Filter questions by topic
            const filteredQuestions = MOCK_QUIZ.questions.filter(
                (q) => q.topic === topic
            );
            return {
                ...MOCK_QUIZ,
                questions:
                    filteredQuestions.length > 0
                        ? filteredQuestions
                        : MOCK_QUIZ.questions,
                title: `${topic} Quiz`,
            };
        }

        return MOCK_QUIZ;
    },

    /**
     * Evaluate quiz answers
     */
    evaluateQuiz: async (
        answers: Record<string, string>
    ): Promise<MockQuizResult> => {
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Calculate results based on answers
        const results: MockQuestionResult[] = MOCK_QUIZ.questions.map((q) => {
            const userAnswer = answers[q.id] || "";
            const isCorrect = userAnswer === q.correctAnswer;

            // Find the corresponding mock result and update it
            const mockResult = MOCK_QUIZ_RESULT.results.find(
                (r) => r.questionId === q.id
            );

            return {
                questionId: q.id,
                question: q.question,
                userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: mockResult?.explanation || q.explanation,
                topic: q.topic,
            };
        });

        const score = results.filter((r) => r.isCorrect).length;
        const percentage = Math.round((score / results.length) * 100);

        // Identify weak and strong areas
        const topicScores: Record<string, { correct: number; total: number }> = {};
        results.forEach((r) => {
            if (!topicScores[r.topic]) {
                topicScores[r.topic] = { correct: 0, total: 0 };
            }
            topicScores[r.topic].total += 1;
            if (r.isCorrect) {
                topicScores[r.topic].correct += 1;
            }
        });

        const weakAreas = Object.entries(topicScores)
            .filter(([_, scores]) => scores.correct / scores.total < 0.7)
            .map(([topic]) => topic);

        const strongAreas = Object.entries(topicScores)
            .filter(([_, scores]) => scores.correct / scores.total >= 0.7)
            .map(([topic]) => topic);

        return {
            quizId: MOCK_QUIZ.id,
            score,
            totalQuestions: results.length,
            percentage,
            results,
            weakAreas,
            strongAreas,
            timestamp: new Date().toISOString(),
        };
    },

    /**
     * Get recommendations based on weak areas
     */
    getRecommendations: async (
        weakAreas: string[]
    ): Promise<MockRecommendation[]> => {
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (weakAreas.length === 0) {
            return MOCK_RECOMMENDATIONS.slice(0, 3);
        }

        // Filter and sort recommendations by weak areas
        return MOCK_RECOMMENDATIONS.filter((rec) => weakAreas.includes(rec.topic))
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 5);
    },

    /**
     * Get mock notes content
     */
    getNotes: (): string => {
        return MOCK_NOTES;
    },
};

export default mockDataService;
