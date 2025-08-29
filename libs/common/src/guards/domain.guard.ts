
function normalizeVN(input: string): string {
    return (input || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

function contains(text: string, keywords: string[]): boolean {
    return keywords.some(k => text.includes(k));
}

export class DomainGuard {
    private static readonly BLOCK = [

        'con ga', 'con vit', 'con heo', 'con bo', 'con cho', 'con meo', 'con tho', 'con chim', 'con ca',
        'dong vat', 'thuc pham', 'mon an', 'nau an', 'am thuc',
        'tin tuc', 'thoi su', 'bong da', 'chung khoan', 'tu vi', 'hoang dao', 'ngoai te', 'gia vang',
    ];

    private static readonly SERVICE = [
        'dich vu', 'nha cung cap', 'provider', 'providers',
        'danh muc', 'category', 'categories',
        'gia', 'bang gia', 'dat lich',
        'service', 'clean', 'repair',
        'providerid', 'categoryid',
    ];

    private static readonly APPLIANCE = [

        'may lanh', 'dieu hoa', 'aircon', 'air conditioner', 'ac',
        'quat dieu hoa', 'quat nhiet', 'quat thong gio',
        'may hut am', 'may tao am',

        'tu lanh', 'refrigerator', 'fridge', 'tu dong', 'tu mat',

        'may giat', 'washing machine', 'may say', 'dryer',

        'may rua chen', 'may rua bat', 'dishwasher',
        'bep tu', 'bep tu cam ung', 'bep dien', 'bep hong ngoai', 'bep ga', 'bep gas', 'bep ga am',
        'lo vi song', 'lo nuong', 'noi com dien', 'noi chien khong dau', 'am sieu toc',
        'may hut mui', 'range hood',
        'may loc nuoc', 'binh loc nuoc', 'cay nuoc nong lanh', 'he thong ro', 'may loc khong khi', 'air purifier',
        'binh nong lanh', 'may nuoc nong', 'binh nuoc nong', 'solar water heater', 'may nang luong mat troi',
        'may bom nuoc', 'may bom tang ap', 'booster pump', 'be nuoc', 'bon nuoc', 'te nuoc',
        'may hut bui', 'robot hut bui', 'robot lau nha',
        'ban ui', 'ban la', 'may say toc', 'may xay sinh to', 'may ep', 'noi ap suat',
        'ong nuoc', 'voi nuoc', 'voi sen', 'sen cay', 'voi rua', 'xi phong', 'siphon', 'thoat nuoc', 'cong thoat nuoc',
        'bon cau', 'bon rua', 'chau rua', 'bon tam', 'voi nuoc nong lanh', 'bom cau',
        'o cam', 'o dien', 'cong tac', 'aptomat', 'mc b', 'rcd', 'rccb', 'cau dao', 'atomat', 'cau chi',
        'on ap', 'ups', 'bo nguon', 'inverter', 'bien ap', 'o cam thong minh', 'switch thong minh',
        'khoa cua', 'khoa thong minh', 'khoa van tay', 'khoa tu', 'ban le', 'tay nam cua',
        'cua cuon', 'cua keo', 'cua kinh', 'cua nhua loi thep', 'cua nhom kinh', 'cua go', 'cua sat',
        'cua so', 'khung cua', 'rem cua', 'rem cuon', 'man cua',
        'mai ton', 'mai ngoi', 'tran nha', 'tuong nha', 'san nha', 'tran thach cao', 'tran nhua',
        'thap nuoc', 'thoat nuoc man', 'mang chong tham',
        'camera', 'chuong cua', 'smart doorbell', 'cam bien chuyen dong', 'relay thong minh', 'cong tac thong minh',
    ];

    private static readonly ACTION = [
        'sua', 'sua chua', 'bao tri', 'bao duong', 've sinh', 'lap dat', 'cai dat', 'cau hinh', 'khoi phuc', 'khac phuc',
        'hong', 'hu', 'loi', 'chap dien', 'nhay aptomat', 'nhay atomat', 'nhay cau dao', 'dut dien',
        'ro ri', 'ri nuoc', 'chay nuoc', 'am moc', 'tham dot', 'thấm dột',
        'tac', 'nghet', 'ngap', 'ui nuoc', 'thu hoi nuoc cham',
        'hao dien', 'ton dien', 'ngon dien', 'dien tang', 'hoa don dien tang', 'bill dien tang',
        'tieu thu dien cao', 'chay lien tuc', 'khong tu ngat', 'qua nhiet', 'nong bat thuong',
        'khong chay', 'khong hoat dong', 'khong len nguon',
        'khong lanh', 'lanh kem', 'khong dong da', 'dong tuyet', 'dong da', 'khong nong', 'nong kem',
        'khong vat', 'khong xa', 'khong xa nuoc', 'khong xa bot', 'chay nuoc ra', 'khong ve sinh duoc',
        'keu', 'on', 'rung', 'giat', 'mui la', 'mui kho chiu', 'mui khét', 'mui ga',
        'chay dien', 'ro dien', 'ram dien', 'nach dien', 'choang dien', 'tia lua', 'phong dien',
        'dong dien ro ri', 'dien giat', 'chay chay den', 'den nhap nhay',
        'ro nuoc', 'ri nuoc', 'vo ong', 'nut ong', 'nut voi', 'dut ong',
        'ket khoa', 'hong khoa', 'le cua', 'xuc xa', 'canh cua xet', 'kho mo', 'mo khong duoc',
        'den bao', 'ma loi', 'error', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5',
    ];

    private static readonly DIAG = [
        'la bi gi', 'vi sao', 'tai sao', 'nguyen nhan',
        'cach khac phuc', 'khac phuc', 'cach sua', 'huong dan', 'fix', 'nguyen nhan va cach xu ly',
    ];

    static isLikelyInDomain(text: string): boolean {
        const t = normalizeVN(text);

        if (contains(t, this.BLOCK)) return false;

        if (contains(t, this.SERVICE)) return true;

        const hasDevice =
            contains(t, this.APPLIANCE);
        const hasSymptom =
            contains(t, this.ACTION) || contains(t, this.DIAG);

        if (hasDevice && hasSymptom) return true;


        return false;
    }
}
