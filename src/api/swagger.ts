export type AudienceGetAudienceBodyParameterSANITIZED = IAudienceRequest;
export type CampaignGetCampaignsBodyParameterSANITIZED = IPagination;
export type CampaignSendCampaignBodyParameterSANITIZED = ICampaign;
export interface IAudienceFilter {
    timezone: number /* double */ [];
    language: string[];
    gender: string[];
    open_rate: {
    };
}
export interface IAudienceRequest {
    filter: IAudienceFilter;
    campaign_type?: "promotional" | "non-promotional";
    pagination: IPagination;
}
export interface ICampaign {
    campaign_name: string;
    filter: IAudienceFilter;
    page_id: string;
    campaign_type: "promotional" | "non-promotional";
    messages: IFacebookBotMessageMessage[];
}
export interface IConnectPageRequest {
    page_id: string;
}
export interface IFacebookAuthRequest {
    token: string;
}
export interface IFacebookBotMessageAttachment {
    type: "image" | "audio" | "video" | "file" | "template";
    payload: {
    };
}
export interface IFacebookBotMessageMessage {
    text?: string;
    attachment?: IFacebookBotMessageAttachment;
    quick_replies?: IQuickReply[];
    metadata?: string;
}
/**
 * Campaign Options include a campaign name, filter for an audience
 */
export interface IPageCampaignStats {
    total_audience: number; // double
    campaigns_sent: number; // double
    number_of_subscribers: number; // double
    open_rate: number; // double
}
export interface IPagination {
    offset: number; // double
    limit: number; // double
    sortBy?: ISorting;
}
export interface IQuickReply {
    content_type: "text" | "location";
    title?: string;
    image_url?: string;
    payload?: string;
}
export interface IRecipients {
    recipients: IRichRecipient[];
    total_amount: number; // double
}
export interface IRichCampaign {
    campaign_id: number; // double
    creator: string;
    open_rate: number; // double
    recipient_amount: number; // double
    creation_date: string; // date-time
    campaign_name: string;
    filter: IAudienceFilter;
    page_id: string;
    campaign_type: "promotional" | "non-promotional";
    messages: IFacebookBotMessageMessage[];
}
export interface IRichCampaigns {
    rich_campaigns: IRichCampaign[];
    total_amount: number; // double
}
export interface IRichRecipient {
    opened_campaigns: number; // double
    total_received_campaigns: number; // double
    open_rate: number; // double
    page_scoped_recipient_id: IrecipientFieldsPageScopedRecipientId;
    page_id: IrecipientFieldsPageId;
    first_name: IrecipientFieldsFirstName;
    last_name: IrecipientFieldsLastName;
    profile_pic: IrecipientFieldsProfilePic;
    locale: IrecipientFieldsLocale;
    timezone: IrecipientFieldsTimezone;
    gender: IrecipientFieldsGender;
    last_ad_referral: IrecipientFieldsLastAdReferral;
    is_payment_enabled: IrecipientFieldsIsPaymentEnabled;
    is_deleted: IrecipientFieldsIsDeleted;
    import_date: IrecipientFieldsImportDate;
}
export interface ISorting {
    key: string;
    direction: "ASC" | "DESC";
}
export interface IStatus {
    status: string;
}
export interface IUserPage {
    page_id: string;
    name: string;
    category: string;
    user_id: number; // double
    is_connected: boolean;
    welcome_message: IFacebookBotMessageMessage[];
}
export interface IUserPages {
    user_pages: IUserPage[];
}
export interface IWelcomeMessageRequest {
    page_id: string;
    welcome_message: IFacebookBotMessageMessage[];
}
export interface IrecipientFieldsFirstName {
}
export interface IrecipientFieldsGender {
}
export interface IrecipientFieldsImportDate {
}
export interface IrecipientFieldsIsDeleted {
}
export interface IrecipientFieldsIsPaymentEnabled {
}
export interface IrecipientFieldsLastAdReferral {
}
export interface IrecipientFieldsLastName {
}
export interface IrecipientFieldsLocale {
}
export interface IrecipientFieldsPageId {
}
export interface IrecipientFieldsPageScopedRecipientId {
}
export interface IrecipientFieldsProfilePic {
}
export interface IrecipientFieldsTimezone {
}
export interface Iuser {
    id: IuserFieldsId;
    email: IuserFieldsEmail;
    first_name: IuserFieldsFirstName;
    last_name: IuserFieldsLastName;
    name: IuserFieldsName;
    gender: IuserFieldsGender;
    locale: IuserFieldsLocale;
    timezone: IuserFieldsTimezone;
    updated_time: IuserFieldsUpdatedTime;
    birthday: IuserFieldsBirthday;
    is_deleted: IuserFieldsIsDeleted;
    sign_up_date: IuserFieldsSignUpDate;
}
export interface IuserFieldsBirthday {
}
export interface IuserFieldsEmail {
}
export interface IuserFieldsFirstName {
}
export interface IuserFieldsGender {
}
export interface IuserFieldsId {
}
export interface IuserFieldsIsDeleted {
}
export interface IuserFieldsLastName {
}
export interface IuserFieldsLocale {
}
export interface IuserFieldsName {
}
export interface IuserFieldsSignUpDate {
}
export interface IuserFieldsTimezone {
}
export interface IuserFieldsUpdatedTime {
}
export type PageUpdateWelcomeMessageBodyParameterSANITIZED = IWelcomeMessageRequest;
export type UserConnectPageBodyParameterSANITIZED = IConnectPageRequest;
export interface UserGetProfileOKResponseSANITIZED {
}
export interface UserGetTestOKResponseSANITIZED {
}
export type UserRegisterFacebookBodyParameterSANITIZED = IFacebookAuthRequest;
export interface WebhookBotResponderBodyParameterSANITIZED {
}
export interface WebpageFetchMetaDataBodyParameterSANITIZED {
}
export interface WebpageFetchMetaDataOKResponseSANITIZED {
}
export type UserRegisterFacebookOKResponseSANITIZED = Iuser;

export type UserGetPagesOKResponseSANITIZED = IUserPages;

export type UserConnectPageOKResponseSANITIZED = IUserPage;

export type UtilHealthCheckOKResponseSANITIZED = any; // TODO string

export type WebhookBotResponderOKResponseSANITIZED = IStatus;

export type CampaignSendCampaignOKResponseSANITIZED = ICampaign;

export type CampaignGetCampaignsOKResponseSANITIZED = IRichCampaigns;

export type CampaignGetCampaignOKResponseSANITIZED = IRichCampaign;

export type CampaignUploadImageOKResponseSANITIZED = any; // TODO string

export type CampaignGetPageCampaignStatsOKResponseSANITIZED = IPageCampaignStats;

export type CampaignRemoveCampaignOKResponseSANITIZED = IStatus;

export type AudienceGetAudienceOKResponseSANITIZED = IRecipients;

export type AudienceRemoveRecipientOKResponseSANITIZED = IStatus;

export type PageUpdateWelcomeMessageOKResponseSANITIZED = IUserPage;

/** fetch() wrapper function */
export type FetchFunc<Options> =
    /**
     * @param input fetch() input
     * @param init fetch() init
     * @param options any options on api call
     * @return fetch() return value
     */
    (input: RequestInfo, init?: RequestInit, options?: Options) => Promise<Response>;

/** fetch() args preprocessors */
export interface FetchPreprocessors {
    /** query preprocessor */
    query?(query?: {[name: string]: any}): {[name: string]: any};
    /** body preprocessor */
    body?(query?: {[name: string]: any}): {[name: string]: any};
}

/** fetch request parameters */
export interface RequestParams {
    /** query string object (ex. `{ q: "search" }`) */
    query?: {[name: string]: any};
    /** body json object (ex. `{ data: "aaa" }`) */
    body?: {[name: string]: any};
    /** headers object (ex. `{ "X-Foo": "bar" }`) */
    header?: {[name: string]: any};
}

/**
 * generate fetch wrapper function
 * @param fetchFunc fetch() function (you can pass wrapper function for fetch())
 * @param preprocess args preprocessors
 */
export function genFetchApi<Options>(
    fetchFunc: FetchFunc<Options> = fetch,
    preprocess: FetchPreprocessors = {},
) {
    /**
     * fetch() wrapper
     * @param root path root (ex. `"https://example.com"`)
     * @param method request method (ex. `"get"`)
     * @param path path (ex. `/foo/bar`)
     * @param params fetch request parameters
     * @param options options on api call
     * @return response json data
     */
    function fetchApi(
        root: string,
        method: string,
        path: string,
        params: RequestParams = {},
        options?: Options,
    ) {
        const query = preprocess.query ? preprocess.query(params.query) : params.query;
        const body = preprocess.body ? preprocess.body(params.body) : params.body;
        const header = params.header || {};

        let pathStr = `${root}${path}`;
        if (query) {
            const queryStrings = [];
            for (const name of Object.keys(query)) {
                const value = query[name];
                // tslint:disable-next-line no-null-keyword
                if (value != null) queryStrings.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
            }
            if (Object.keys(queryStrings).length) {
                pathStr += `?${queryStrings.join("&")}`;
            }
        }
        header["Content-Type"] = "application/json";

        return fetchFunc(
            pathStr,
            { method, headers: new Headers(header), body: JSON.stringify(body) },
            options,
        );
    }

    return fetchApi;
}

// tslint:disable-next-line no-magic-numbers
export interface OKResponse<ResponseType, StatusCode extends number = 200> extends Response {
    ok: true;
    status: StatusCode;
    json(): Promise<ResponseType>;
}

export interface NGResponse<ResponseType, StatusCode extends number> extends Response {
    ok: false;
    status: StatusCode;
    json(): Promise<ResponseType>;
}

export const generateApi = <Options = any>(root: string, fetchFunc: FetchFunc<Options> = fetch, preprocess?: FetchPreprocessors) => {
    const fetchApi = genFetchApi(fetchFunc, preprocess);

    return {
        NO_TAG: {
            /**
             * POST /user/register-facebook
             * @param body body
             * @param options options on api call
             */
            UserRegisterFacebook(
                body: UserRegisterFacebookBodyParameterSANITIZED,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "POST", `/user/register-facebook`, {body}, options)
                ) as Promise<
                    OKResponse<UserRegisterFacebookOKResponseSANITIZED, 200>
                >;
            },
            /**
             * GET /user/profile
             * @param options options on api call
             */
            UserGetProfile(
                options?: Options,
            ) {
                return (
                    fetchApi(root, "GET", `/user/profile`, {}, options)
                ) as Promise<
                    OKResponse<UserGetProfileOKResponseSANITIZED, 200>
                >;
            },
            /**
             * POST /user/pages
             * @param options options on api call
             */
            UserGetPages(
                options?: Options,
            ) {
                return (
                    fetchApi(root, "POST", `/user/pages`, {}, options)
                ) as Promise<
                    OKResponse<UserGetPagesOKResponseSANITIZED, 200>
                >;
            },
            /**
             * POST /user/connect-page
             * @param body body
             * @param options options on api call
             */
            UserConnectPage(
                body: UserConnectPageBodyParameterSANITIZED,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "POST", `/user/connect-page`, {body}, options)
                ) as Promise<
                    OKResponse<UserConnectPageOKResponseSANITIZED, 200>
                >;
            },
            /**
             * GET /user/test
             * @param options options on api call
             */
            UserGetTest(
                options?: Options,
            ) {
                return (
                    fetchApi(root, "GET", `/user/test`, {}, options)
                ) as Promise<
                    OKResponse<UserGetTestOKResponseSANITIZED, 200>
                >;
            },
            /**
             * GET /health-check
             * @param options options on api call
             */
            UtilHealthCheck(
                options?: Options,
            ) {
                return (
                    fetchApi(root, "GET", `/health-check`, {}, options)
                ) as Promise<
                    OKResponse<UtilHealthCheckOKResponseSANITIZED, 200>
                >;
            },
            /**
             * POST /webhook/page
             * @param body body
             * @param options options on api call
             */
            WebhookBotResponder(
                body: WebhookBotResponderBodyParameterSANITIZED,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "POST", `/webhook/page`, {body}, options)
                ) as Promise<
                    OKResponse<WebhookBotResponderOKResponseSANITIZED, 200>
                >;
            },
            /**
             * POST /campaign/send
             * @param body body
             * @param options options on api call
             */
            CampaignSendCampaign(
                body: CampaignSendCampaignBodyParameterSANITIZED,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "POST", `/campaign/send`, {body}, options)
                ) as Promise<
                    OKResponse<CampaignSendCampaignOKResponseSANITIZED, 200>
                >;
            },
            /**
             * POST /campaign/page-id/${page_id}
             * @param page_id undefined
             * @param body body
             * @param options options on api call
             */
            CampaignGetCampaigns(
                page_id: string,
                body: CampaignGetCampaignsBodyParameterSANITIZED,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "POST", `/campaign/page-id/${page_id}`, {body}, options)
                ) as Promise<
                    OKResponse<CampaignGetCampaignsOKResponseSANITIZED, 200>
                >;
            },
            /**
             * GET /campaign/campaign-id/${campaign_id}
             * @param campaign_id undefined
             * @param options options on api call
             */
            CampaignGetCampaign(
                campaign_id: number,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "GET", `/campaign/campaign-id/${campaign_id}`, {}, options)
                ) as Promise<
                    OKResponse<CampaignGetCampaignOKResponseSANITIZED, 200>
                >;
            },
            /**
             * POST /campaign/upload-image
             * @param options options on api call
             */
            CampaignUploadImage(
                options?: Options,
            ) {
                return (
                    fetchApi(root, "POST", `/campaign/upload-image`, {}, options)
                ) as Promise<
                    OKResponse<CampaignUploadImageOKResponseSANITIZED, 200>
                >;
            },
            /**
             * GET /campaign/stats/${page_id}
             * @param page_id undefined
             * @param options options on api call
             */
            CampaignGetPageCampaignStats(
                page_id: string,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "GET", `/campaign/stats/${page_id}`, {}, options)
                ) as Promise<
                    OKResponse<CampaignGetPageCampaignStatsOKResponseSANITIZED, 200>
                >;
            },
            /**
             * DELETE /campaign/${page_id}/campaign/${campaign_id}
             * @param page_id undefined
             * @param campaign_id undefined
             * @param options options on api call
             */
            CampaignRemoveCampaign(
                page_id: string,
                campaign_id: number,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "DELETE", `/campaign/${page_id}/campaign/${campaign_id}`, {}, options)
                ) as Promise<
                    OKResponse<CampaignRemoveCampaignOKResponseSANITIZED, 200>
                >;
            },
            /**
             * POST /audience/${page_id}
             * @param page_id undefined
             * @param body body
             * @param options options on api call
             */
            AudienceGetAudience(
                page_id: string,
                body: AudienceGetAudienceBodyParameterSANITIZED,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "POST", `/audience/${page_id}`, {body}, options)
                ) as Promise<
                    OKResponse<AudienceGetAudienceOKResponseSANITIZED, 200>
                >;
            },
            /**
             * DELETE /audience/${page_id}/subscriber/${page_scoped_recipient_id}
             * @param page_id undefined
             * @param page_scoped_recipient_id undefined
             * @param options options on api call
             */
            AudienceRemoveRecipient(
                page_id: string,
                page_scoped_recipient_id: string,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "DELETE", `/audience/${page_id}/subscriber/${page_scoped_recipient_id}`, {}, options)
                ) as Promise<
                    OKResponse<AudienceRemoveRecipientOKResponseSANITIZED, 200>
                >;
            },
            /**
             * POST /page/welcome_message
             * @param body body
             * @param options options on api call
             */
            PageUpdateWelcomeMessage(
                body: PageUpdateWelcomeMessageBodyParameterSANITIZED,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "POST", `/page/welcome_message`, {body}, options)
                ) as Promise<
                    OKResponse<PageUpdateWelcomeMessageOKResponseSANITIZED, 200>
                >;
            },
            /**
             * POST /webpage/metadata
             * @param body body
             * @param options options on api call
             */
            WebpageFetchMetaData(
                body: WebpageFetchMetaDataBodyParameterSANITIZED,
                options?: Options,
            ) {
                return (
                    fetchApi(root, "POST", `/webpage/metadata`, {body}, options)
                ) as Promise<
                    OKResponse<WebpageFetchMetaDataOKResponseSANITIZED, 200>
                >;
            },
        },
    };
};

