// @ts-nocheck - Edge Function para Deno runtime
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

interface WelcomeEmailPayload {
  email: string
  businessName: string
  ownerName: string
  websiteSlug: string
  trialEndsAt: string
}

interface ResendEmailRequest {
    from: string
    to: string[]
    subject: string
    html: string
}

interface ResendEmailResponse {
    id: string
    [key: string]: unknown
}

interface ErrorResponse {
    error: string
    details?: unknown
}

interface SuccessResponse {
    success: boolean
    emailId: string
}

serve(async (req: Request): Promise<Response> => {
    try {
        const payload: WelcomeEmailPayload = await req.json()

        // Calcular dias do trial
        const trialEndDate: Date = new Date(payload.trialEndsAt)
        const today: Date = new Date()
        const daysRemaining: number = Math.ceil((trialEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // HTML do email
        const emailHtml: string = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao AdminImobiliaria</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                🎉 Bem-vindo ao AdminImobiliaria!
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                                Olá <strong>${payload.ownerName}</strong>,
                            </p>

                            <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.6;">
                                Parabéns! Sua conta <strong>${payload.businessName}</strong> foi criada com sucesso! 🚀
                            </p>

                            <!-- Trial Box -->
                            <div style="background: linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%); border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                                <p style="margin: 0 0 10px; font-size: 18px; color: #1f2937; font-weight: bold;">
                                    ✨ Seu teste grátis começou!
                                </p>
                                <p style="margin: 0; font-size: 16px; color: #4b5563;">
                                    Você tem <strong style="color: #3b82f6;">${daysRemaining} dias</strong> para explorar todas as funcionalidades sem compromisso.
                                </p>
                            </div>

                            <h2 style="margin: 30px 0 15px; font-size: 20px; color: #1f2937; font-weight: bold;">
                                🔗 Acesse seu painel:
                            </h2>

                            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                <p style="margin: 0 0 5px; font-size: 14px; color: #6b7280;">Endereço do painel:</p>
                                <p style="margin: 0; font-size: 16px; color: #3b82f6; font-weight: 600;">
                                    <a href="https://painel.adminimobiliaria.site" style="color: #3b82f6; text-decoration: none;">
                                        painel.adminimobiliaria.site
                                    </a>
                                </p>
                            </div>

                            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                <p style="margin: 0 0 5px; font-size: 14px; color: #6b7280;">Seu site público:</p>
                                <p style="margin: 0; font-size: 16px; color: #8b5cf6; font-weight: 600;">
                                    <a href="https://${payload.websiteSlug}.adminimobiliaria.site" style="color: #8b5cf6; text-decoration: none;">
                                        ${payload.websiteSlug}.adminimobiliaria.site
                                    </a>
                                </p>
                            </div>

                            <h2 style="margin: 30px 0 15px; font-size: 20px; color: #1f2937; font-weight: bold;">
                                📋 Primeiros passos:
                            </h2>

                            <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
                                <li style="margin-bottom: 10px;">Faça login no painel administrativo</li>
                                <li style="margin-bottom: 10px;">Configure o logo e cores da sua imobiliária</li>
                                <li style="margin-bottom: 10px;">Cadastre seus primeiros imóveis</li>
                                <li style="margin-bottom: 10px;">Adicione corretores à sua equipe</li>
                                <li style="margin-bottom: 10px;">Personalize seu site público</li>
                            </ol>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 40px 0;">
                                <a href="https://painel.adminimobiliaria.site" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                                    🚀 Acessar Meu Painel
                                </a>
                            </div>

                            <!-- Support Box -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                                <p style="margin: 0 0 10px; font-size: 16px; color: #78350f; font-weight: bold;">
                                    💬 Precisa de ajuda?
                                </p>
                                <p style="margin: 0; font-size: 14px; color: #92400e;">
                                    Nossa equipe está pronta para te ajudar! Entre em contato através da seção "Suporte" no painel ou responda este email.
                                </p>
                            </div>

                            <p style="margin: 30px 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
                                Estamos felizes em ter você conosco! 🎊
                            </p>

                            <p style="margin: 10px 0 0; font-size: 16px; color: #374151;">
                                Atenciosamente,<br>
                                <strong>Equipe AdminImobiliaria</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                                © 2025 AdminImobiliaria - Sistema de Gestão Imobiliária
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                Este é um email automático. Por favor, não responda.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `

        // Enviar email via Resend
        const resendResponse: Response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'AdminImobiliaria <onboarding@adminimobiliaria.com>',
                to: [payload.email],
                subject: `🎉 Bem-vindo ao AdminImobiliaria, ${payload.ownerName}!`,
                html: emailHtml,
            } satisfies ResendEmailRequest),
        })

        const resendData: ResendEmailResponse = await resendResponse.json()

        if (!resendResponse.ok) {
            console.error('Resend error:', resendData)
            return new Response(
                JSON.stringify({ error: 'Failed to send email', details: resendData } satisfies ErrorResponse),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ success: true, emailId: resendData.id } satisfies SuccessResponse),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' } satisfies ErrorResponse),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})
