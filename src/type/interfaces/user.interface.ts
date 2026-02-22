export interface UserProfile {
    id: string;
    username: string;
    password?: string;
    lastname: string;
    firstname: string;
    middlename: string;
    fullname: string;
    shortname: string;
    phone: string;
    system: string;
    user_type: 'main' | 'secondary' ,
    expiry_date: string;
    trial_start_date: string | null;
    trial_end_date: string | null;
    last_payment_date: string | null;
    last_payment_amount: number | string;
    total_payment_amount: number | string;
    is_deleted: boolean | "TRUE" | "FALSE";
}