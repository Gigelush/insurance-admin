export interface Policy {
    id: string;
    holder: string;
    type: string;
    address: string;
    status: "Active" | "Expired" | "Pending";
    expiry: string;
    cnp?: string;
    phone?: string;
    email?: string;
    startDate?: string;
    insuredLocations?: string[];
    details?: any;
}

export interface FileAttachment {
    name: string;
    type: string;
    content: string; // Base64 or URL
    category?: 'photo' | 'document' | 'estimate' | 'other';
    uploadedAt: string;
}

export interface ClaimHistoryItem {
    date: string;
    event: string;
    details: string;
    user: string;
}

export interface ClaimPayment {
    amount: string;
    date: string;
    iban: string;
    details: string;
    beneficiaryName: string;
    cnp: string;
    address: string;
    email: string;
    phone: string;
    bank: string;
    claimDate: string;
    registrationDate: string;
    validated?: boolean;
    validatedAt?: string; // timestamp when the referat was validated
    reserveType?: string;
    paidAt?: string; // timestamp when financial dept processed the payment
}

export interface RegressDetails {
    type: 'neighbor' | 'tenant' | 'company' | string;
    name?: string;
    address?: string;
    apartment?: string;
    phone?: string;
    email?: string;

    companyName?: string;
    companyEmail?: string;
    companyPhone?: string;
    fileNo?: string;
    policyNo?: string;
    fileCreated?: boolean;

    amount: string;
    status: 'initiated' | 'notice_sent' | 'agreed' | 'in_progress' | 'completed' | 'legal' | 'abandoned' | string;
    notes?: string;
    linkedPayments?: any[];
    recoveredPayments?: {
        date: string;
        amount: string;
        details: string;
        documentName?: string;
    }[];
}

export interface ClaimReserve {
    materials?: string;
    labor?: string;
    contractor?: string;
    other?: string;
    legal?: string;
    total?: string;
    updatedAt?: string;
}

export interface Claim {
    id: string;
    policyId: string;
    holderName: string;
    date: string;
    time: string;
    description: string;
    status: "Deschis" | "Inchis Partial" | "Finalizat" | "Rezerva" | "Oferta" | "Redeschis" | string;
    submittedAt: string;
    type?: string;
    hasRegress?: boolean;
    location?: string;
    cause?: string;
    witnesses?: string;
    email?: string;
    details?: any;

    files?: FileAttachment[];
    history?: ClaimHistoryItem[];
    payments?: ClaimPayment[];
    payment?: ClaimPayment; // Legacy support — to be migrated
    reserve?: ClaimReserve;
    regress?: RegressDetails;
}

export interface UserProfile {
    name: string;
    avatar: string | null;
    address: string;
    cnp: string;
    phone: string;
    city?: string;
    county?: string;
}

export interface Request {
    id: string;
    name: string;
    type: string;
    address: string;
    timestamp: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    coverage?: number;
    details?: string;
}

export interface Message {
    text: string;
    sender: 'user' | 'agent';
    timestamp?: string;
    claimId?: string;
    read?: boolean;
    attachment?: FileAttachment;
    id?: string;
}

export interface Collaborator {
    id: string;
    name: string;
    companyName?: string;
    type?: string;
    specialty: string;
    phone: string;
    email: string;
    region: string;
    status: 'active' | 'inactive';
    createdAt: string;
}

export interface Avizare {
    id: string;
    policyId: string;
    holderName: string;
    date: string;
    time: string;
    description: string;
    status: 'Nou' | 'In Lucru' | 'Finalizat' | string;
    createdAt: string;
    dataAvizare?: string; // date when the avizare was completed
    claimId?: string; // linked claim if one was created from this avizare
}
