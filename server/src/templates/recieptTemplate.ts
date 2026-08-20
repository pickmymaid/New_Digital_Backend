import moment from "moment";
import path from "path";
import PdfMake, {createPdf, fonts} from "pdfmake/build/pdfmake";
import PdfFonts from "pdfmake/build/vfs_fonts";
import fs from 'fs'

PdfMake.vfs = PdfFonts.pdfMake.vfs

const VAT_RATE = 5;

export const recieptTemplate = async (billAddress: string, transRef: string, plan: string, validity: string, amount: number, recieptNumber: number, startData: string) => {
    const basePrice = amount * (100 / (100 + VAT_RATE));
    
    const definition:any = {
        content: [
            {
                image: `data:image/png;base64,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`,
                width: 100,
                margin: [0,20]
            },
            {
                columns: [
                    {
                        text: `Tax Invoice: ${recieptNumber}`,
                        bold: true
                    },
                    {
                      text: startData,
                      alignment: 'right'
                    }
                ]
            },
            {
                text: 'Tax Registration Number: 104284919800003',
                margin: [0, 10]
            },
            {
                text: 'Bill To',
                style: 'header',
                margin: [0, 30, 0,10]
            },
            {                
                text: billAddress,
                lineHeight: 1.5,
                fontSize: 10,
            },
            {
                text: 'Subscription Details',
                style: 'header',
                margin: [0, 30, 0,10]
            },
            {
                table: {
                    widths: [ 'auto', 'auto', '*', 'auto' ],
                    body: [
                        [
                            {
                                text: 'Transaction ID',
                                border: [false],
                                style: 'tableHeader'
                            },
                            {
                                text: 'Subscription Plan',
                                border: [false],
                                style: 'tableHeader',
                                margin: [0,5,5,5]
                            },
                            {
                                text: 'Subscription Period',
                                border: [false],
                                style: 'tableHeader'
                            },
                            {
                                text: 'Amount',
                                border: [false],
                                alignment: 'right',
                                style: 'tableHeader'
                            }
                        ],
                        [
                            {
                                text: transRef,
                                border: [false],
                                style: 'tableBody'
                            },
                            {
                                text: plan,
                                border: [false],
                                style: 'tableBody'
                            },
                            {
                                text: validity,
                                border: [false],
                                style: 'tableBody'
                            },
                            {
                                text: `AED ${basePrice.toFixed(2)}`,
                                border: [false],
                                alignment: 'right',
                                style: 'tableBody'
                            }
                        ],
                    ],
                },
            },
            {   
                table: {
                    widths: ['*', 'auto'],
                    body: [
                        [
                            { text: 'VAT 5%', bold: true, fontSize: 10, alignment: 'right', margin: [2, 2] },
                            { text: `AED ${(amount - basePrice).toFixed(2)}`, fontSize: 10, alignment: 'right', margin: [2, 2] }
                        ],
                        [
                            { text: 'Taxable Amount', bold: true,alignment: 'right', margin: [2, 2] },
                            { text: `AED ${amount}`, alignment: 'right', bold: true, margin: [2, 2] }
                        ]
                    ],
                },
                layout: {
                    hLineWidth: function (i: any, node:any) {
                        return (i === 0 || i === node.table.body.length) ? 1 : 0; // Only top and bottom borders
                    },
                    vLineWidth: function (i: any, node:any) {
                        return 0; // No vertical borders
                    }
                },
                margin: [0, 0, 0, 20]
            },
            {
                text: 'Thank you for choosing us for your subscription. If you have any questions or need assistance, please feel free to contact us at pickmymaid@gmail.com. We look forward to serving you again soon!',
                lineHeight: '1.2',
                fontSize: 10,
            },
            {
                text: '\n\n\n\nRefund and Cancellation Policy',
                bold: true,
                margin: [0,10,0,5],
                fontSize: 10,
            },
            {
                text: 'All payments made are non-refundable once access is granted. Subscription cancellations cannot be processed during the active period. The subscription will be automatically canceled upon completion of the subscribed duration',
                lineHeight: 1.2,
                fontSize: 10,
            }
        ],
        images: {
            logo: ''
        },
        styles: {
            header: {
                fontSize: 13,
                bold: true,
                alignment: 'justify'
            },
            tableHeader: {
                bold: true,
                fillColor: '#FF8F5F',
                color: 'white',
                fontSize: 10,
                margin: [0,5]
            },
            tableBody: {
                fontSize: 10,
                fillColor: '#f0f8ff',
                margin: [0,5]
            }
        }
        
    }

    try{
        let buffer = null
        const pdf = await new Promise((resolve, reject) => {
            createPdf(definition).getDataUrl((blob) => {
                resolve(blob)
                
            })
        })
        
        return {
            status: true, 
            buffer: pdf
        }
    }catch(err:any){
        console.log(err,'err');
        
        return {
            status: false,
            buffer: false
        }
    }
}