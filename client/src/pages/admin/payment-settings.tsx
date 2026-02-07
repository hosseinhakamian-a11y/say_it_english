import { AdminLayout } from "./layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    CreditCard,
    Plus,
    Trash2,
    Wallet,
    Bitcoin,
    Save,
    Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { pageVariants, containerVariants, itemVariants } from "@/lib/animations";
import { ListItemSkeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

interface BankCard {
    id: string;
    cardNumber: string;
    holderName: string;
    bankName: string;
}

interface CryptoWallet {
    id: string;
    network: string;
    address: string;
    label: string;
}

interface PaymentSettings {
    bankCards: BankCard[];
    cryptoWallets: CryptoWallet[];
}

export default function AdminPaymentSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [bankCards, setBankCards] = useState<BankCard[]>([]);
    const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);

    const { data: settings, isLoading } = useQuery<PaymentSettings>({
        queryKey: ["/api/payment-settings"],
        queryFn: async () => {
            const res = await fetch("/api/payment-settings");
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        },
    });

    useEffect(() => {
        if (settings) {
            setBankCards(settings.bankCards || []);
            setCryptoWallets(settings.cryptoWallets || []);
        }
    }, [settings]);

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<PaymentSettings>) => {
            const res = await fetch("/api/payment-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "✅ تنظیمات ذخیره شد" });
            queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
        },
        onError: () => {
            toast({ title: "❌ خطا در ذخیره", variant: "destructive" });
        },
    });

    const addBankCard = () => {
        setBankCards([
            ...bankCards,
            { id: Date.now().toString(), cardNumber: "", holderName: "", bankName: "" },
        ]);
    };

    const removeBankCard = (id: string) => {
        setBankCards(bankCards.filter((c) => c.id !== id));
    };

    const updateBankCard = (id: string, field: keyof BankCard, value: string) => {
        setBankCards(
            bankCards.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        );
    };

    const addCryptoWallet = () => {
        setCryptoWallets([
            ...cryptoWallets,
            { id: Date.now().toString(), network: "TRC20", address: "", label: "" },
        ]);
    };

    const removeCryptoWallet = (id: string) => {
        setCryptoWallets(cryptoWallets.filter((w) => w.id !== id));
    };

    const updateCryptoWallet = (
        id: string,
        field: keyof CryptoWallet,
        value: string
    ) => {
        setCryptoWallets(
            cryptoWallets.map((w) => (w.id === id ? { ...w, [field]: value } : w))
        );
    };

    const handleSave = () => {
        updateMutation.mutate({ bankCards, cryptoWallets });
    };

    return (
        <AdminLayout>
            <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                className="space-y-8"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl text-white shadow-lg shadow-green-500/30"
                        >
                            <Wallet className="h-6 w-6" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                تنظیمات پرداخت
                            </h1>
                            <p className="text-gray-500 mt-1">
                                مدیریت شماره کارت و آدرس کیف پول
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="rounded-xl btn-press"
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : (
                            <Save className="h-4 w-4 ml-2" />
                        )}
                        ذخیره تغییرات
                    </Button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                    </div>
                ) : (
                    <>
                        {/* Bank Cards Section */}
                        <Card className="rounded-2xl border-0 shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    شماره کارت‌های بانکی
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addBankCard}
                                    className="rounded-xl"
                                >
                                    <Plus className="h-4 w-4 ml-1" />
                                    افزودن کارت
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {bankCards.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        هنوز کارتی اضافه نشده است
                                    </p>
                                ) : (
                                    <motion.div
                                        variants={containerVariants}
                                        initial="initial"
                                        animate="animate"
                                        className="space-y-4"
                                    >
                                        {bankCards.map((card, idx) => (
                                            <motion.div
                                                key={card.id}
                                                variants={itemVariants}
                                                className="p-4 bg-muted/30 rounded-xl border"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>شماره کارت</Label>
                                                        <Input
                                                            placeholder="6037-9973-XXXX-XXXX"
                                                            value={card.cardNumber}
                                                            onChange={(e) =>
                                                                updateBankCard(card.id, "cardNumber", e.target.value)
                                                            }
                                                            className="rounded-xl font-mono"
                                                            dir="ltr"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>نام صاحب کارت</Label>
                                                        <Input
                                                            placeholder="نام و نام خانوادگی"
                                                            value={card.holderName}
                                                            onChange={(e) =>
                                                                updateBankCard(card.id, "holderName", e.target.value)
                                                            }
                                                            className="rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>نام بانک</Label>
                                                        <Input
                                                            placeholder="ملی، ملت، صادرات..."
                                                            value={card.bankName}
                                                            onChange={(e) =>
                                                                updateBankCard(card.id, "bankName", e.target.value)
                                                            }
                                                            className="rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                                            onClick={() => removeBankCard(card.id)}
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Crypto Wallets Section */}
                        <Card className="rounded-2xl border-0 shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Bitcoin className="h-5 w-5 text-orange-500" />
                                    کیف پول‌های رمز ارز
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addCryptoWallet}
                                    className="rounded-xl"
                                >
                                    <Plus className="h-4 w-4 ml-1" />
                                    افزودن کیف پول
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {cryptoWallets.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        هنوز کیف پولی اضافه نشده است
                                    </p>
                                ) : (
                                    <motion.div
                                        variants={containerVariants}
                                        initial="initial"
                                        animate="animate"
                                        className="space-y-4"
                                    >
                                        {cryptoWallets.map((wallet, idx) => (
                                            <motion.div
                                                key={wallet.id}
                                                variants={itemVariants}
                                                className="p-4 bg-muted/30 rounded-xl border"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>شبکه</Label>
                                                        <Input
                                                            placeholder="TRC20, ERC20, BEP20..."
                                                            value={wallet.network}
                                                            onChange={(e) =>
                                                                updateCryptoWallet(wallet.id, "network", e.target.value)
                                                            }
                                                            className="rounded-xl"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <Label>آدرس کیف پول</Label>
                                                        <Input
                                                            placeholder="TQXkK..."
                                                            value={wallet.address}
                                                            onChange={(e) =>
                                                                updateCryptoWallet(wallet.id, "address", e.target.value)
                                                            }
                                                            className="rounded-xl font-mono text-sm"
                                                            dir="ltr"
                                                        />
                                                    </div>
                                                    <div className="flex items-end gap-2">
                                                        <div className="flex-1 space-y-2">
                                                            <Label>برچسب</Label>
                                                            <Input
                                                                placeholder="تتر، بیت‌کوین..."
                                                                value={wallet.label}
                                                                onChange={(e) =>
                                                                    updateCryptoWallet(wallet.id, "label", e.target.value)
                                                                }
                                                                className="rounded-xl"
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                                            onClick={() => removeCryptoWallet(wallet.id)}
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </motion.div>
        </AdminLayout>
    );
}
