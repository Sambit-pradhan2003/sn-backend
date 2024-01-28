class apierror extends Error{
    constructor(
        statuscode,
        message="something went wrong",
        error=[],
        stack=""
    ){
        super(message)
        this.statuscode=statuscode
        this.data=null
        this.message=message
        this.error=error
        this.sucess=false

        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {apierror}